import mongoose from "mongoose";
const { Schema } = mongoose;

if (!mongoose.models.Document) {
  const filesSchema = new Schema(
    {
      name: String,
      url: String,
      size: Number,
      key: String,
    })

  const docsSchema = new Schema({
    pageContent: String,
    metadata: {},
  })

  const documentsSchema = new Schema(
    {
      fileData: filesSchema,
      docs: [docsSchema],
      embeddings: [],
    },
    {
      timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    }
  );

  mongoose.model("Document", documentsSchema);
}

export default mongoose.models.Document;