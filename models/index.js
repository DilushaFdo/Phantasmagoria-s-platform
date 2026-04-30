const User = require("./User");
const Profile = require("./Profile");
const Degree = require("./Degree");
const Certification = require("./Certification");
const Licence = require("./Licence");
const ProfessionalCourse = require("./ProfessionalCourse");
const EmploymentHistory = require("./EmploymentHistory");
const Bid = require("./Bid");
const ApiKey = require("./ApiKey");
const ApiUsageLog = require("./ApiUsageLog");
const LoginLog = require("./LoginLog");
const Session = require("./Session");
const CsrfToken = require("./CsrfToken");
const Sponsorship = require("./Sponsorship");

// define all the database relations here
// user has one profile info
User.hasOne(Profile);
Profile.belongsTo(User);

// profile has multiple degrees, certs etc.
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

// bids belong to a user
User.hasMany(Bid);
Bid.belongsTo(User);

// api keys for developers
User.hasMany(ApiKey);
ApiKey.belongsTo(User);

// track when api is used
ApiKey.hasMany(ApiUsageLog);
ApiUsageLog.belongsTo(ApiKey);

// session and security tracking stuff
User.hasMany(LoginLog);
LoginLog.belongsTo(User);

User.hasMany(Session);
Session.belongsTo(User);

User.hasMany(CsrfToken);
CsrfToken.belongsTo(User);

// sponsorship relations
User.hasMany(Sponsorship, { foreignKey: 'SponsorId', as: 'SponsorOfferings' });
Sponsorship.belongsTo(User, { foreignKey: 'SponsorId', as: 'Sponsor' });

Profile.hasMany(Sponsorship);
Sponsorship.belongsTo(Profile);

Certification.hasMany(Sponsorship);
Sponsorship.belongsTo(Certification);

Licence.hasMany(Sponsorship);
Sponsorship.belongsTo(Licence);

module.exports = { User, Profile, Degree, Certification, Licence, ProfessionalCourse, EmploymentHistory, Bid, ApiKey, ApiUsageLog, LoginLog, Session, CsrfToken, Sponsorship };
