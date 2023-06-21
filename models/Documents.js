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
      savedInPinecone: {
        type: Boolean,
        default: false
      },
    },
    {
      timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
      virtuals: {
        pageContentSummary: {
          get() {
            let summary = [];
            if (this.vectors.length===0) return []
            for (let i = 0; i < 3; i++) {
              summary.push(this.vectors[i].pageContent);
            }
            return summary;
          }
        },
        embeddingSummary: {
          get() {
            if (this.vectors.length===0) return []
            let summary = [];
            for (let i = 0; i < 3; i++) {
              summary.push(JSON.stringify(this.vectors[i]?.values.map(x => x).join(',')));
            }
            return summary;
          }
        },
      }
    }
  );

  documentsSchema.set('toJSON', { virtuals: true });

  mongoose.model("Document", documentsSchema);
}

export default mongoose.models.Document;




