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

  const vectorsSchema = new Schema({
    pageContent: String,
    metadata: {},
    //embeddings 1536(dimensions)
    values: []
  })

  const documentsSchema = new Schema(
    {
      //S3 file
      fileData: filesSchema,
      //raw text 251 x {pageContent, metadata}
      vectors: [vectorsSchema],
      namespace: String,
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