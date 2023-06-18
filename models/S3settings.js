import mongoose from "mongoose";
const { Schema } = mongoose;

if (!mongoose.models.S3settings) {
  const S3settingsSchema = new Schema(
    {
      uploadUrl: String,
      downloadUrl: String,
    })
 
  mongoose.model("S3setting", S3settingsSchema);
}

export default mongoose.models.S3setting;