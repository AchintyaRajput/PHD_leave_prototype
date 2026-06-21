import { Injectable } from '@angular/core';

export interface StudentProfile {
  name: string;
  rollNumber: string;
  initials: string;
  program: string;
  department: string;
  advisor: string;
  taInstructor: string;
  pgcChair: string;
}

@Injectable({ providedIn: 'root' })
export class LeaveApplicationService {
  private readonly students: StudentProfile[] = [
    {
      name: 'Achintya Rajput',
      rollNumber: '2024025',
      initials: 'AR',
      program: 'PhD',
      department: 'Computer Science',
      advisor: 'Prof. Anand Kumar',
      taInstructor: 'Prof. Ritu Singhal',
      pgcChair: 'Prof. M. Balakrishnan',
    },
    {
      name: 'Aditya Kumar',
      rollNumber: '2024026',
      initials: 'AK',
      program: 'PhD',
      department: 'Electrical Engineering',
      advisor: 'Prof. Ritu Singhal',
      taInstructor: 'Prof. Anand Kumar',
      pgcChair: 'Prof. M. Balakrishnan',
    },
    {
      name: 'Deepanshu Singh',
      rollNumber: '2024027',
      initials: 'DS',
      program: 'PhD',
      department: 'Mechanical Engineering',
      advisor: 'Prof. M. Balakrishnan',
      taInstructor: 'Prof. Anand Kumar',
      pgcChair: 'Prof. Ritu Singhal',
    },
  ];

  /** Returns the logged-in student profile (student side). */
  getStudentProfile(): StudentProfile {
    return this.students[0];
  }

  /** Returns all registered students. */
  getAllStudents(): StudentProfile[] {
    return this.students;
  }

  /** Looks up a student by roll number. */
  getStudentByRollNumber(rollNo: string): StudentProfile | undefined {
    return this.students.find(s => s.rollNumber === rollNo);
  }

  /** Case-insensitive partial match on name or roll number. */
  searchStudents(query: string): StudentProfile[] {
    if (!query || query.trim().length === 0) return [];
    const q = query.toLowerCase().trim();
    return this.students.filter(
      s => s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q)
    );
  }
}
