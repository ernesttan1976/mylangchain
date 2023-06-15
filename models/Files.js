import mongoose from "mongoose";
const { Schema } = mongoose;

if (!mongoose.models.File) {
  const filesSchema = new Schema(
    {
      file: Buffer,
      index: Number,
      count: Number,
    })
 
  mongoose.model("File", filesSchema);
}

export default mongoose.models.File;