# Project Engineering Rules

- Enforce owner, role, and membership boundaries in row-level policies, allowing shared reads only where explicitly intended; use fixed-search-path security-definer helpers for nonrecursive membership checks so access limits hold outside the user interface.