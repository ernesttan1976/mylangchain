import mongoose from "mongoose";
const { Schema } = mongoose;

if (!mongoose.models.Log) {
  const logsSchema = new Schema(
    {
      bot: String,
      history: [String],
      question: String,
      toolsSelect: [String],
    },
    {
      timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    }
  );

  mongoose.model("Log", logsSchema);
}

export default mongoose.models.Log;




