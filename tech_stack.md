# 🛠️ DataSense AI — Technology Stack

## 🎨 Frontend
| Technology | Purpose |
| :--- | :--- |
| **Next.js** | React web framework for routing, SSR, and API integration. |
| **TypeScript** | Type safety across the application. |
| **Tailwind CSS** | Utility-first styling. |
| **shadcn/ui** | Accessible and customizable UI components. |
| **Plotly.js** | Powerful interactive analytics charts. |
| **Framer Motion** | Smooth animations for dashboard transitions. |

## ⚙️ Backend
| Technology | Purpose |
| :--- | :--- |
| **Python 3.11+** | Main backend language for API and ML. |
| **FastAPI** | High-performance REST API framework. |
| **Pydantic** | Data validation and settings management. |
| **Uvicorn** | ASGI web server implementation for FastAPI. |

## 🤖 Agentic AI Runtime
| Technology | Purpose |
| :--- | :--- |
| **DeepSeek Harness** | Multi-agent orchestration, custom plugins, agent tools, sessions, and multi-step execution. (Isolated behind application interfaces due to preview status). |

## 🧠 Development Agent Platform
| Technology | Purpose |
| :--- | :--- |
| **Google Antigravity** | Parallel coding, architecture planning, UI generation, testing, debugging, and browser verification during development. |

## 📊 Data Processing
- **Pandas:** Tabular data manipulation and analysis.
- **NumPy:** Numerical computing.
- **OpenPyXL:** Excel file parsing.
- **PyArrow:** Efficient data serialization and storage.

## 🔬 Machine Learning
- **Scikit-learn:** Core machine learning library.
- **SciPy:** Scientific computing.
- **Algorithms:** KMeans, DBSCAN, Isolation Forest, PCA, StandardScaler, SimpleImputer.

## 🗄️ Database & Storage (Hackathon Setup)
| Technology | Purpose |
| :--- | :--- |
| **Supabase** | Backend-as-a-Service providing: <br/> - PostgreSQL Database <br/> - Authentication <br/> - File Storage (for uploaded datasets) |

## 🔑 Key Architectural Pattern
**Separation of Concerns:** Data processing tools (Pandas, Scikit-learn) must remain independent of the AI harness. Python/ML handles facts (calculations), while the Agent/LLM handles decisions and explanations, preventing hallucinations.
