# AXIS Portal — Design System Reference

> Integrated AXIS base tokens with PhD Leave Module specific patterns.

---

## Brand & Style

The design system is built for the **AXIS Portal**, focusing on clarity, institutional trust, and academic progress. The brand personality is **professional and systematic**, designed to reduce the cognitive load of students tracking complex graduation requirements and leave policies.

The visual style follows a **Corporate Modern** aesthetic with **Tonal Layering**. It prioritizes high-information density while maintaining "breathability" through structured whitespace. The interface uses a fixed architectural sidebar to provide a constant sense of orientation, while content is housed in clean, elevated containers that signify modularity and focus.

---

## Color Palette

### Primary Brand Colors
| Token | Hex | Usage |
|---|---|---|
| `--primary` | `#006565` | Primary brand colour, sidebar accents, primary action states |
| `--primary-container` | `#008080` | Primary container/background for brand elements |
| `--on-primary` | `#FFFFFF` | Text/icons on primary surfaces |
| `--on-primary-container` | `#E3FFFE` | Text/icons on primary containers |
| `--inverse-primary` | `#76D6D5` | Inverse primary for dark contexts |

### Surface & Background (Tonal Layering)
| Token | Hex | Usage |
|---|---|---|
| `--surface-app-bg` | `#f4f7f9` | The absolute bottom layer; the app background |
| `--surface-card` | `#ffffff` | Elevated containers, tables, and forms |
| `--axis-border` | `#e0e4ea` | Subtle dividers and table borders |

### Typography
| Token | Hex | Usage |
|---|---|---|
| `--axis-text-primary` | `#1c2b3a` | High-emphasis text, headings, main data points |
| `--axis-text-secondary` | `#6b7a8d` | Labels, table headers, supporting text |

### Semantic Status Colors (Pills & Badges)
| Token | Hex | Usage |
|---|---|---|
| `--status-approved-bg` | `#e8f5e9` | Background for "Approved" / "Eligible" |
| `--status-approved-text` | `#1b5e20` | Text for "Approved" / "Eligible" |
| `--status-pending-bg` | `#fff8e1` | Background for "Pending Advisor" / "Pending Infirmary" |
| `--status-pending-text` | `#f57f17` | Text for "Pending" states |
| `--status-rejected-bg` | `#ffebee` | Background for "Rejected" / "Not Eligible" |
| `--status-rejected-text` | `#c62828` | Text for "Rejected" / "Not Eligible" |

---

## PhD Leave Module: Component Patterns

### 1. Leave Balance Dashboard (Metric Cards)
* **Layout:** Responsive CSS Grid of summary cards at the top of the workspace.
* **Structure:** White `--surface-card` with a subtle `box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08)`.
* **Data Visualization:** Incorporate circular progress rings tracking "Availed" vs "Balance" for standard leaves (Casual, Vacation).

### 2. Dynamic Application Form
* **Container:** Centered max-width container to restrict form width for readability.
* **Inputs:** Clean borders utilizing `--axis-border`. Focus states must shift to `--primary`.
* **Dynamic Zones:** Hidden dashed-border regions (e.g., Document Upload) that conditionally render based on the Leave Type dropdown selection (e.g., Medical Leave).

### 3. Leave Status Board (Data Tables)
* **Table Structure:** Full-width layout (`width: 100%`) with `min-width: 900px` to prevent data squishing.
* **Headers:** Sticky table headers (`position: sticky; top: 0`) utilizing `--surface-card` background and `--axis-text-secondary` text.
* **Row Hover:** Subtle row highlight effect (`background-color: #fbfbfb`) to guide the user's eye across wide data rows.
* **Actionable Links:** Use an accent link (e.g., `--primary`) coupled with a FontAwesome icon (e.g., `fa-file-pdf`) for viewing uploaded certificates.