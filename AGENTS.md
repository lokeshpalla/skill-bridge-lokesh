# Project Engineering Rules

- Enforce data visibility in database row-level policies: shared catalog and community reads require authentication, personal vote and badge history is owner-scoped, and ended room history is creator-scoped; this keeps access limits effective outside the user interface.