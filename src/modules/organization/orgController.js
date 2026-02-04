import Membership from "../../../models/Membership.js";
import Organization from "../../../models/Organisation.js";

// CREATE ORGANIZATION
export const createOrganization = async (req, res) => {
  const { name } = req.body;
  const userId = req.user.userId;

  const org = await Organization.create({
    name,
    ownerId: userId
  });

  // creator becomes OWNER
  await Membership.create({
    userId,
    orgId: org._id,
    role: "OWNER"
  });

  res.status(201).json({
    message: "Organization created",
    orgId: org._id
  });
};

// LIST USER ORGANIZATIONS
export const listOrganisations = async (req, res) => {
  const userId = req.user.userId;

  const memberships = await Membership.find({ userId })
    .populate("orgId");

  res.json(
    memberships.map(m => ({
      orgId: m.orgId._id,
      name: m.orgId.name,
      role: m.role
    }))
  );
};