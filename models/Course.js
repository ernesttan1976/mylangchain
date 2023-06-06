import mongoose from "mongoose";
const { Schema } = mongoose;
import User from './User.js';

const discussionSchema = new Schema(
  {
    text: {
      type: String,
    },
    name: {
      type: String,
    },
    avatar: {
      type: String,
    },
  },
  {
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

const lessonSchema = new Schema(
  {
    title: {
      type: String,
      trim: true,
      minlength: 3,
      maxlength: 320,
      required: true,
    },
    description: {
      type: String,
    },
    image: {
      type: String,
      validate: {
        validator: function (value) {
          // Regular expression to match URLs with common image file extensions
          var regex = /.*\.(jpg|jpeg|gif|png|bmp).*/i;
          return regex.test(value);
        },
        message: "Please provide a valid image URL",
      },
    },
    video: {
      type: String,
    },
    duration: {
      type: Number,
      integer: true,
      min: 1,
    }
  },
  { timestamps: true }
);

const imagesSchema = new Schema(
  {
    name: {
      type: String,
    },
    url: {
      type: String,
      validate: {
        validator: function (value) {
          // Regular expression to match URLs with common image file extensions
          var regex = /.*\.(jpg|jpeg|gif|png|bmp).*/i;
          return regex.test(value);
        },
        message: "Please provide a valid image URL",
      },
    },
    size: {
      type: Number,
    },
    key: {
      type: String,
    },
    uid: {
      type: String,
    },
  }
)

const coursesSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
    },
    image: [imagesSchema],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return value > this.startDate;
        },
        message: "End date must be after start date",
      },
    },
    price: {
      type: Number,
      get: (v) => parseFloat(v).toFixed(2),
      set: (v) => parseFloat(v).toFixed(2)
    },
 
    instructor_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    students_id: [{
      type: Schema.Types.ObjectId,
      ref: "User",
    }],
    lessons_id: [lessonSchema],
    discussions_id: [discussionSchema],
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

export default mongoose.model("Course", coursesSchema);