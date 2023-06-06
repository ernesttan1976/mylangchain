import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema } = mongoose;
const SALT_ROUNDS = 6;

const usersSchema = new Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      required: true,
    },
    password: {
      type: String,
      unique: true,
      trim: true,
      minLength: 5,
    },
    role: {
      type: String,
      default: 'Student',
      enum: ["Student", "Instructor", "Admin"]
    },
    avatar: {
      type: String,
    },
    stripe_account_id: {
      type: String,
    },
    stripe_seller: {},
    stripeSession: {},
    courses_id: [{
      type: Schema.Types.ObjectId,
      ref: "Course",
    }]
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

usersSchema.pre("save", async function (next) {
  // 'this' is the user doc
  if (!this.isModified("password")) return next();
  // update the password with the computed hash pw
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  return next();
});

usersSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret["password"];
    return ret;
  },
});

export default mongoose.model("User", usersSchema);