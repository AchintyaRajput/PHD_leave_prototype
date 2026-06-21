import express, { Request, Response } from "express";
import nodemailer from "nodemailer";
import path from "path";
import xlsx from "xlsx";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";

interface LeaveRequest {
  rowId: number;
  name: string;
  rollNo: string;
  program: string;
  courses: {
    course: string;
    instructor: string | null;
  }[];
  leaveFrom: string;
  leaveTo: string;
  document: string;
  email: string;
  approval: {
    admin: string | null;
    infirmary: string | null;
    ugc: string | null;
  };
  source: string;
  createdAt: Date;

  eligibility?: {
    status: "Eligible" | "Not Eligible";
    reasons: string[];
  };
}

const { db } = require("../db");

const router = express.Router();
const collection = db.collection("leave-requests");
const infirmaryQueue = db.collection("infirmary-queue");
const summaryCollection = db.collection("student-leave-summary");
const ugcQueue = db.collection("ugc-queue");


const GOOGLE_SCRIPT_URL = process.env.GOOGLE_FORM_SCRIPT_URL as string;
const GOOGLE_LEAVE_SHEET_URL = process.env.GOOGLE_LEAVE_SHEET_URL as string;

const EXAM_DATES = {
  midsem: {
    start: new Date('2026-02-20'),
    end: new Date('2026-02-28')
  },
  endsem: {
    start: new Date('2026-04-25'),
    end: new Date('2026-05-05')
  }
};

const SEMESTER_DATES = {
  start: new Date('2026-01-01'),
  end: new Date('2026-05-15')
};

const isInSemester = (date: Date): boolean => {
  return (
    date >= SEMESTER_DATES.start &&
    date <= SEMESTER_DATES.end
  );
};

const isExamDay = (date: Date): boolean => {
  return (
    (date >= EXAM_DATES.midsem.start && date <= EXAM_DATES.midsem.end) ||
    (date >= EXAM_DATES.endsem.start && date <= EXAM_DATES.endsem.end)
  );
};

const calculateEffectiveLeaveDays = (from: string, to: string) => {
  let days = 0;
  let isExamLeave = false;

  const start = new Date(from);
  const end = new Date(to);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (isExamDay(d)) {
      isExamLeave = true;
      continue;
    }
    days++;
  }

  return { days, isExamLeave };
};



// const parseCourseAndInstructor = (raw: string) => {
//   if (!raw) return { course: null, instructor: null };

//   const parts = raw.split("_");

//   if (parts.length < 2) {
//     return { course: raw, instructor: null };
//   }

//   return {
//     course: parts.slice(0, -1).join("_").trim(),
//     instructor: parts[parts.length - 1].trim(),
//   };
// };

const parseCourses = (raw: string) => {
  if (!raw) return [];

  // FIRST split courses properly
  const courseEntries = raw
    .split(",")
    .map(c => c.trim())
    .filter(Boolean);

  return courseEntries.map(entry => {
    const parts = entry.split("_").map(p => p.trim());

    if (parts.length < 3) {
      return {
        course: entry,
        instructor: null
      };
    }

    return {
      course: parts.slice(0, -1).join("_"),
      instructor: parts[parts.length - 1]
    };
  });
};

router.post("/sync-with-google-form", async (_req: Request, res: Response) => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL);
    const sheetData = await response.json();

    let insertedCount = 0;

    for (let i = 0; i < sheetData.length; i++) {
      const row = sheetData[i];

      const courses = parseCourses(row["Courses"]);

      const leaveRequest: LeaveRequest = {
        rowId: i + 2,
        name: row["Name"],
        rollNo: row["Roll No"],
        program: row["Program"],
        courses,
        leaveFrom: row["Leave From"],
        leaveTo: row["Leave To"],
        document: row["Upload Medical Document"],
        email: row["Email Address"],
        approval: {
          infirmary: "Pending",
          ugc: null,
          admin: "Locked"
        },
        source: "google-form",
        createdAt: new Date(row["Timestamp"] || new Date()),
      };

      const exists = await collection.findOne({
        rowId: leaveRequest.rowId,
        email: leaveRequest.email,
      });

      // if (!exists) {
      //   // ✅ NEW LEAVE
      //   await collection.insertOne(leaveRequest);
      //   insertedCount++;

      //   const { days: leaveDays, isExamLeave } =
      //     calculateEffectiveLeaveDays(
      //       leaveRequest.leaveFrom,
      //       leaveRequest.leaveTo
      //     );

      //   await fetch(GOOGLE_LEAVE_SHEET_URL, {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({
      //       email: leaveRequest.email,
      //       days: leaveDays,
      //       isExamLeave,
      //     }),
      //   });

      // } 
      if (!exists) {
        

        await collection.insertOne(leaveRequest);
        insertedCount++;

        const { days: leaveDays, isExamLeave } =
          calculateEffectiveLeaveDays(
            leaveRequest.leaveFrom,
            leaveRequest.leaveTo
          );

        await summaryCollection.updateOne(
          { email: leaveRequest.email, semester: "2026-S1" },
          {
            $setOnInsert: {
              email: leaveRequest.email,
              semester: "2026-S1"
            },
            $inc: {
              totalLeaves: 1,
              totalDays: leaveDays,
              examLeaves: isExamLeave ? 1 : 0
            },
            $set: { updatedAt: new Date() }
          },
          { upsert: true }
        );


        // 🔹 Fetch updated summary
        const summary = await summaryCollection.findOne({
          email: leaveRequest.email,
          semester: "2026-S1"
        });

        const reasons: string[] = [];
        let eligible = true;

        if (summary && summary.totalDays > 20) {
          reasons.push("Total semester leave days exceed 20 days.");
          eligible = false;
        }

        // 🔹 Update eligibility in leave record
        await collection.updateOne(
          { rowId: leaveRequest.rowId, email: leaveRequest.email },
          {
            $set: {
              eligibility: {
                status: eligible ? "Eligible" : "Not Eligible",
                reasons,
                snapshot: {
                  totalLeaves: summary?.totalLeaves || 0,
                  totalDays: summary?.totalDays || 0,
                  examLeaves: summary?.examLeaves || 0
                }
              }
            }
          }
        );

        const insertedLeave = await collection.findOne({
          rowId: leaveRequest.rowId,
          email: leaveRequest.email
        });

        

        if (insertedLeave) {
          const alreadyQueued = await infirmaryQueue.findOne({
          leaveRequestId: insertedLeave._id
        });

        if (!alreadyQueued) {
          await infirmaryQueue.insertOne({
            leaveRequestId: insertedLeave._id,
            rowId: insertedLeave.rowId,
            name: insertedLeave.name,
            rollNo: insertedLeave.rollNo,
            email: insertedLeave.email,
            program: insertedLeave.program,
            courses: insertedLeave.courses,
            leaveFrom: insertedLeave.leaveFrom,
            leaveTo: insertedLeave.leaveTo,
            document: insertedLeave.document ?? null,
            routedAt: new Date(),
            infirmaryStatus: "Pending"
          });
        }

          if (!eligible) {
            // Not eligible → prepare UGC step (locked for now)
            await collection.updateOne(
              { _id: insertedLeave._id },
              {
                $set: {
                  "approval.ugc": "Locked"
                }
              }
            );
          }
        }



        await fetch(GOOGLE_LEAVE_SHEET_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: leaveRequest.email,
            days: leaveDays,
            isExamLeave,
          }),
        });

      } 
      else {
        await collection.updateOne(
          { _id: exists._id },
          {
            $set: {
              createdAt: leaveRequest.createdAt,
              courses: leaveRequest.courses
            },
          }
        );
      }
    }

    res.status(200).json({
      message: "Google Form synced successfully",
      insertedCount,
    });
  } catch (error) {
    console.error("❌ Sync failed:", error);
    res.status(500).json({
      message: "Failed to sync with Google Form",
      error,
    });
  }
});

router.get("/student/:email", async (req: Request, res: Response) => {
  try {
    const requests = await collection
      .find({ email: req.params.email })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch student leave requests",
      error,
    });
  }
});

router.get("/all", async (_req: Request, res: Response) => {
  try {
    const requests = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch leave requests",
      error,
    });
  }
});

router.patch("/update-status", async (req: Request, res: Response) => {
  const { rowId, status } = req.body;

  if (!rowId || !status) {
    return res.status(400).json({
      message: "rowId and status are required",
    });
  }

  if (!["Approved", "Rejected", "Pending"].includes(status)) {
    return res.status(400).json({
      message: "Invalid status value",
    });
  }

  try {
    const result = await collection.updateOne(
      { rowId },
      {
        $set: {
          "approval.admin": status,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "Leave request not found",
      });
    }

    // await fetch(GOOGLE_SCRIPT_URL, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ rowId, status }),
    // });

    // if (status === "Approved") {
    //   const requestDetails = await collection.findOne({ rowId });

    //   if (requestDetails) {

    //     // 🔹 Push into infirmary-queue (handoff to infirmary)
    //     const alreadyQueued = await infirmaryQueue.findOne({
    //       leaveRequestId: requestDetails._id
    //     });

    //     if (!alreadyQueued) {
    //       const { days, isExamLeave } = calculateEffectiveLeaveDays(
    //         requestDetails.leaveFrom,
    //         requestDetails.leaveTo
    //       );

    //       await infirmaryQueue.insertOne({
    //         leaveRequestId: requestDetails._id,
    //         rowId: requestDetails.rowId,

    //         name: requestDetails.name,
    //         rollNo: requestDetails.rollNo,
    //         email: requestDetails.email,
    //         program: requestDetails.program,
    //         course: requestDetails.course,
    //         instructor: requestDetails.instructor ?? null,

    //         leaveFrom: requestDetails.leaveFrom,
    //         leaveTo: requestDetails.leaveTo,
    //         document: requestDetails.document ?? null,

    //         effectiveLeaveDays: days,
    //         isExamLeave,

    //         adminApprovedAt: new Date(),
    //         infirmaryStatus: "Pending"
    //       });
    //     }
    //   }
    // }

    // If Admin takes final decision → trigger mail
    if (status === "Approved" || status === "Rejected") {

      const leaveDoc = await collection.findOne({ rowId });

      if (leaveDoc) {
        console.log("📧 Ready to send final decision email to:", leaveDoc.email);
        // Add nodemailer logic here later
      }
    }


    res.status(200).json({
      message: "Leave status updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update leave status",
      error,
    });
  }
});

router.get("/infirmary/pending", async (_req: Request, res: Response) => {
  try {
    const requests = await infirmaryQueue
      .find({ infirmaryStatus: "Pending" })
      .sort({routedAt: -1})
      .toArray();

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch infirmary requests",
      error
    });
  }
});

// router.patch("/infirmary/update-status", async (req: Request, res: Response) => {
//   const { leaveRequestId, status } = req.body;

//   if (!["Approved", "Rejected"].includes(status)) {
//     return res.status(400).json({ message: "Invalid status" });
//   }

//   // 1️⃣ Update infirmary queue
//   await infirmaryQueue.updateOne(
//     { _id: new ObjectId(leaveRequestId) },
//     {
//       $set: {
//         infirmaryStatus: status,
//         infirmaryActionAt: new Date()
//       }
//     }
//   );

//   // 2️⃣ Sync back to leave-requests
//   await collection.updateOne(
//     { _id: new ObjectId(leaveRequestId)},
//     {
//       $set: {
//         "approval.infirmary": status
//       }
//     }
//   );

//   res.json({ message: "Infirmary status updated" });
// });

// router.patch("/infirmary/update-status", async (req: Request, res: Response) => {
//   const {
//     leaveRequestId,
//     status,
//     approvedFrom,
//     approvedTo,
//     remarks
//   } = req.body;

//   if (!leaveRequestId || !status) {
//     return res.status(400).json({ message: "Invalid payload" });
//   }

//   if (!["Approved", "Partially Approved", "Rejected"].includes(status)) {
//     return res.status(400).json({ message: "Invalid status" });
//   }

//   // Reject must have reason
//   if (status === "Rejected" && !remarks) {
//     return res.status(400).json({
//       message: "Remarks required for rejection"
//     });
//   }

//   try {
//     const leaveObjId = new ObjectId(leaveRequestId);

//     // Build update object
//     const update: any = {
//       infirmaryStatus: status,
//       infirmaryActionAt: new Date(),
//       infirmaryRemarks: remarks || null
//     };

//     if (status !== "Rejected") {
//       update.approvedFrom = approvedFrom;
//       update.approvedTo = approvedTo;
//     }

//     // 1️⃣ Update infirmary queue
//     const result = await infirmaryQueue.updateOne(
//       { leaveRequestId: leaveObjId },
//       { $set: update }
//     );

//     if (result.matchedCount === 0) {
//       return res.status(404).json({ message: "Infirmary request not found" });
//     }

//     // 2️⃣ Sync summary to leave-requests
//     await collection.updateOne(
//       { _id: leaveObjId },
//       {
//         $set: {
//           "approval.infirmary": status,
//           "approval.infirmaryRemarks": remarks || null,
//           "approval.approvedFrom": approvedFrom || null,
//           "approval.approvedTo": approvedTo || null
//         }
//       }
//     );

//     res.json({ message: "Infirmary decision saved" });

//   } catch (error) {
//     console.error("❌ Infirmary update failed:", error);
//     res.status(500).json({
//       message: "Failed to update infirmary decision",
//       error
//     });
//   }
// });

// router.patch("/infirmary/update-status", async (req: Request, res: Response) => {
//   const {
//     leaveRequestId,
//     status,
//     approvedFrom,
//     approvedTo,
//     reason
//   } = req.body;

//   if (!leaveRequestId || !status) {
//     return res.status(400).json({ message: "Invalid payload" });
//   }

//   if (!["Approved", "Partial", "Rejected"].includes(status)) {
//     return res.status(400).json({ message: "Invalid status" });
//   }

//   if (status === "Rejected" && !reason) {
//     return res.status(400).json({
//       message: "Reason required for rejection"
//     });
//   }

//   try {
//     // ⚡ DO NOT manually convert to ObjectId
//     // MongoDB automatically casts string to ObjectId

//     const update: any = {
//       infirmaryStatus: status,
//       infirmaryActionAt: new Date(),
//       infirmaryRemarks: reason || null
//     };

//     if (status !== "Rejected") {
//       update.approvedFrom = approvedFrom || null;
//       update.approvedTo = approvedTo || null;
//     }

//     // 1️⃣ Update infirmary queue
//     const leaveObjId = new mongoose.Types.ObjectId(leaveRequestId);
//     const result = await infirmaryQueue.updateOne(
//       { leaveRequestId: leaveObjId },  // <-- STRING is fine
//       { $set: update }
//     );

//     if (result.matchedCount === 0) {
//       return res.status(404).json({ message: "Infirmary request not found" });
//     }

//     // 2️⃣ Sync to leave-requests
//     // await collection.updateOne(
//     //   { _id: leaveObjId },  // <-- STRING is fine
//     //   {
//     //     $set: {
//     //       "approval.infirmary": status,
//     //       "approval.infirmaryDetails": {
//     //         approvedFrom: approvedFrom || null,
//     //         approvedTo: approvedTo || null,
//     //         reason: reason || null
//     //       }
//     //     }
//     //   }
//     // );

//     const leaveDoc = await collection.findOne({ _id: leaveObjId });

//       if (!leaveDoc) {
//         return res.status(404).json({ message: "Leave not found" });
//       }

//       // if (leaveDoc.eligibility?.status === "Eligible") {

//       //   // Eligible → unlock Admin directly
//       //   await collection.updateOne(
//       //     { _id: leaveObjId },
//       //     {
//       //       $set: {
//       //         "approval.infirmary": status,
//       //         "approval.admin": "Pending",
//       //         "approval.ugc": null,
//       //         "approval.infirmaryDetails": {
//       //           approvedFrom: approvedFrom || null,
//       //           approvedTo: approvedTo || null,
//       //           reason: reason || null
//       //         }
//       //       }
//       //     }
//       //   );

//       // } else {

//       //   // Not Eligible → unlock UGC first
//       //   await collection.updateOne(
//       //     { _id: leaveObjId },
//       //     {
//       //       $set: {
//       //         "approval.infirmary": status,
//       //         "approval.ugc": "Pending",
//       //         "approval.admin": "Locked",
//       //         "approval.infirmaryDetails": {
//       //           approvedFrom: approvedFrom || null,
//       //           approvedTo: approvedTo || null,
//       //           reason: reason || null
//       //         }
//       //       }
//       //     }
//       //   );
//       // }

//       if (status === "Rejected") {
//         // If infirmary rejects → directly unlock Admin
//         await collection.updateOne(
//           { _id: leaveObjId },
//           {
//             $set: {
//               "approval.infirmary": status,
//               "approval.admin": "Pending",
//               "approval.ugc": null,
//               "approval.infirmaryDetails": {
//                 approvedFrom: approvedFrom || null,
//                 approvedTo: approvedTo || null,
//                 reason: reason || null
//               }
//             }
//           }
//         );

//       } else {

//         if (leaveDoc.eligibility?.status === "Eligible") {

//           await collection.updateOne(
//             { _id: leaveObjId },
//             {
//               $set: {
//                 "approval.infirmary": status,
//                 "approval.admin": "Pending",
//                 "approval.ugc": null,
//                 "approval.infirmaryDetails": {
//                   approvedFrom: approvedFrom || null,
//                   approvedTo: approvedTo || null,
//                   reason: reason || null
//                 }
//               }
//             }
//           );

//         } else {

//           await collection.updateOne(
//             { _id: leaveObjId },
//             {
//               $set: {
//                 "approval.infirmary": status,
//                 "approval.ugc": "Pending",
//                 // 🔹 Add to UGC queue
//                 "approval.admin": "Locked",
//                 "approval.infirmaryDetails": {
//                   approvedFrom: approvedFrom || null,
//                   approvedTo: approvedTo || null,
//                   reason: reason || null
//                 }
//               }
//             }
//           );

//         }
//       }

//     res.json({ message: "Infirmary decision saved" });

//   } catch (error) {
//     console.error("❌ Infirmary update failed:", error);
//     res.status(500).json({
//       message: "Failed to update infirmary decision",
//       error
//     });
//   }


// }

// );

router.patch("/infirmary/update-status", async (req: Request, res: Response) => {

  const {
    leaveRequestId,
    status,
    approvedFrom,
    approvedTo,
    reason
  } = req.body;

  if (!leaveRequestId || !status) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  if (!["Approved", "Partial", "Rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  if (status === "Rejected" && !reason) {
    return res.status(400).json({ message: "Reason required for rejection" });
  }

  try {

    const leaveObjId = new mongoose.Types.ObjectId(leaveRequestId);

    // 1️⃣ Update infirmary queue
    await infirmaryQueue.updateOne(
      { leaveRequestId: leaveObjId },
      {
        $set: {
          infirmaryStatus: status,
          infirmaryActionAt: new Date(),
          infirmaryRemarks: reason || null,
          approvedFrom: approvedFrom || null,
          approvedTo: approvedTo || null
        }
      }
    );

    const leaveDoc = await collection.findOne({ _id: leaveObjId });

    if (!leaveDoc) {
      return res.status(404).json({ message: "Leave not found" });
    }

    // 🔴 If rejected → go to admin directly
    if (status === "Rejected") {

      await collection.updateOne(
        { _id: leaveObjId },
        {
          $set: {
            "approval.infirmary": status,
            "approval.admin": "Pending",
            "approval.ugc": null
          }
        }
      );

      return res.json({ message: "Infirmary rejected. Sent to Admin." });
    }

    // 🟢 If eligible → skip UGC
    if (leaveDoc.eligibility?.status === "Eligible") {

      await collection.updateOne(
        { _id: leaveObjId },
        {
          $set: {
            "approval.infirmary": status,
            "approval.admin": "Pending",
            "approval.ugc": null
          }
        }
      );

      return res.json({ message: "Infirmary approved. Sent to Admin." });
    }

    // 🟡 Not eligible → send to UGC

    await collection.updateOne(
      { _id: leaveObjId },
      {
        $set: {
          "approval.infirmary": status,
          "approval.ugc": "Pending",
          "approval.admin": "Locked"
        }
      }
    );

    // Insert into UGC queue (if not already present)
    const alreadyInUgcQueue = await ugcQueue.findOne({
      leaveRequestId: leaveObjId
    });

    if (!alreadyInUgcQueue) {

      const { days, isExamLeave } = calculateEffectiveLeaveDays(
        leaveDoc.leaveFrom,
        leaveDoc.leaveTo
      );

      await ugcQueue.insertOne({
        leaveRequestId: leaveObjId,
        rowId: leaveDoc.rowId,
        name: leaveDoc.name,
        rollNo: leaveDoc.rollNo,
        email: leaveDoc.email,
        program: leaveDoc.program,
        courses: leaveDoc.courses,
        leaveFrom: leaveDoc.leaveFrom,
        leaveTo: leaveDoc.leaveTo,
        document: leaveDoc.document ?? null,
        effectiveLeaveDays: days,
        isExamLeave,
        routedAt: new Date(),
        ugcStatus: "Pending"
      });
    }

    res.json({ message: "Infirmary approved. Sent to UGC." });

  } catch (error) {
    console.error("❌ Infirmary update failed:", error);
    res.status(500).json({
      message: "Failed to update infirmary decision",
      error
    });
  }

});


// ⚠️ DEV ONLY — REMOVE AFTER USE
router.delete("/clear-all", async (_req: Request, res: Response) => {
  try {
    await collection.deleteMany({});
    await infirmaryQueue.deleteMany({});
    await ugcQueue.deleteMany({});
    await summaryCollection.deleteMany({});  // ✅ ADD THIS

    res.status(200).json({
      message: "All leave, infirmary, UGC and summary records deleted successfully"
    });

  } catch (error) {
    console.error("❌ Failed to clear data:", error);
    res.status(500).json({
      message: "Failed to delete records",
      error
    });
  }
});

router.get("/summary/:email", async (req: Request, res: Response) => {
  try {
    const summary = await summaryCollection.findOne({
      email: req.params.email,
      semester: "2026-S1"
    });

    if (!summary) {
      return res.json({
        totalLeaves: 0,
        totalDays: 0,
        examLeaves: 0
      });
    }

    res.json({
      totalLeaves: summary.totalLeaves || 0,
      totalDays: summary.totalDays || 0,
      examLeaves: summary.examLeaves || 0
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch summary",
      error
    });
  }
});


router.get("/ugc/pending", async (_req: Request, res: Response) => {
  try {
    const requests = await ugcQueue
      .find({ ugcStatus: "Pending" })
      .sort({ routedAt: -1 })
      .toArray();

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch UGC requests",
      error
    });
  }
});

router.patch("/ugc/update-status", async (req: Request, res: Response) => {

  const {
    leaveRequestId,
    status,
    approvedFrom,
    approvedTo,
    reason
  } = req.body;

  if (!leaveRequestId || !status) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  if (!["Approved", "Partial", "Rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const leaveObjId = new mongoose.Types.ObjectId(leaveRequestId);

  try {

    // 1️⃣ Update UGC Queue
    await ugcQueue.updateOne(
      { leaveRequestId: leaveObjId },
      {
        $set: {
          ugcStatus: status,
          ugcActionAt: new Date(),
          ugcRemarks: reason || null,
          approvedFrom: approvedFrom || null,
          approvedTo: approvedTo || null
        }
      }
    );

        // Remove from UGC queue once decided
    if (status === "Approved" || status === "Rejected" || status === "Partial") {
      await ugcQueue.deleteOne({ leaveRequestId: leaveObjId });
    }

    // 2️⃣ Sync back to leave collection
    await collection.updateOne(
      { _id: leaveObjId },
      {
        $set: {
          "approval.ugc": status,
          "approval.admin": "Pending"
        }
      }
    );

    res.json({ message: "UGC decision saved" });

  } catch (error) {
    res.status(500).json({
      message: "Failed to update UGC status",
      error
    });
  }
});



export default router;


