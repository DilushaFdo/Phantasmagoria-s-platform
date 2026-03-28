const User = require("./User");
const Profile = require("./Profile");
const Degree = require("./Degree");
const Certification = require("./Certification");
const Licence = require("./Licence");
const ProfessionalCourse = require("./ProfessionalCourse");
const EmploymentHistory = require("./EmploymentHistory");
const Bid = require("./Bid");

// User - Profile association
User.hasOne(Profile);
Profile.belongsTo(User);

// Profile - Credential associations
Profile.hasMany(Degree);
Degree.belongsTo(Profile);

Profile.hasMany(Certification);
Certification.belongsTo(Profile);

Profile.hasMany(Licence);
Licence.belongsTo(Profile);

Profile.hasMany(ProfessionalCourse);
ProfessionalCourse.belongsTo(Profile);

Profile.hasMany(EmploymentHistory);
EmploymentHistory.belongsTo(Profile);

// User - Bid association
User.hasMany(Bid);
Bid.belongsTo(User);

module.exports = { User, Profile, Degree, Certification, Licence, ProfessionalCourse, EmploymentHistory, Bid };
