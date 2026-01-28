// Prisma CLI default location override for multi-file schema
// Ensures both Prisma 6 (deprecated package.json config) and Prisma 7+ find the schema folder.
module.exports = {
  // Folder path required for multi-file schema (prismaSchemaFolder)
  schema: "prisma/schema",
};
