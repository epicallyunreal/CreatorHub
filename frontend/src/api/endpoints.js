import api from "./client";

export const login = (creds) => api.post("/auth/login/", creds);
export const onboardClient = (data) => api.post("/auth/onboard/", data);

// Employees
export const getEmployees = (p) => api.get("/employees/", { params: p });
export const getEmployee = (id) => api.get(`/employees/${id}/`);
export const createEmployee = (d) => api.post("/employees/", d);
export const updateEmployee = (id, d) => api.patch(`/employees/${id}/`, d);
export const deleteEmployee = (id) => api.delete(`/employees/${id}/`);
export const getMyProfile = () => api.get("/employees/me/");

// Roles
export const getRoles = (p) => api.get("/roles/", { params: p });
export const getRole = (id) => api.get(`/roles/${id}/`);
export const createRole = (d) => api.post("/roles/", d);
export const updateRole = (id, d) => api.patch(`/roles/${id}/`, d);
export const deleteRole = (id) => api.delete(`/roles/${id}/`);
export const getPermissions = () => api.get("/permissions/");
export const assignPermissions = (roleId, permissionIds) => api.post(`/roles/${roleId}/permissions/`, { permission_ids: permissionIds });

// Brands
export const getBrands = (p) => api.get("/brands/", { params: p });
export const getBrand = (id) => api.get(`/brands/${id}/`);
export const createBrand = (d) => api.post("/brands/", d);
export const updateBrand = (id, d) => api.patch(`/brands/${id}/`, d);
export const deleteBrand = (id) => api.delete(`/brands/${id}/`);

// Brand Contacts
export const getBrandContacts = (brandId) => api.get(`/brands/${brandId}/contacts/`);
export const createBrandContact = (brandId, d) => api.post(`/brands/${brandId}/contacts/`, d);
export const updateBrandContact = (brandId, id, d) => api.patch(`/brands/${brandId}/contacts/${id}/`, d);
export const deleteBrandContact = (brandId, id) => api.delete(`/brands/${brandId}/contacts/${id}/`);

// Creators
export const getCreators = (p) => api.get("/creators/", { params: p });
export const getCreator = (id) => api.get(`/creators/${id}/`);
export const createCreator = (d) => api.post("/creators/", d);
export const updateCreator = (id, d) => api.patch(`/creators/${id}/`, d);
export const deleteCreator = (id) => api.delete(`/creators/${id}/`);

// Creator Documents
export const getCreatorDocuments = (creatorId) => api.get(`/creators/${creatorId}/documents/`);
export const uploadCreatorDocument = (creatorId, d) => api.post(`/creators/${creatorId}/documents/`, d);
export const verifyCreatorDocument = (creatorId, id) => api.post(`/creators/${creatorId}/documents/${id}/verify/`);
export const deleteCreatorDocument = (creatorId, id) => api.delete(`/creators/${creatorId}/documents/${id}/`);

// Creator Platforms
export const getCreatorPlatforms = (creatorId) => api.get(`/creators/${creatorId}/platforms/`);
export const createCreatorPlatform = (creatorId, d) => api.post(`/creators/${creatorId}/platforms/`, d);
export const updateCreatorPlatform = (creatorId, id, d) => api.patch(`/creators/${creatorId}/platforms/${id}/`, d);
export const deleteCreatorPlatform = (creatorId, id) => api.delete(`/creators/${creatorId}/platforms/${id}/`);

// Creator Domains
export const getCreatorDomains = (creatorId) => api.get(`/creators/${creatorId}/domains/`);
export const createCreatorDomain = (creatorId, d) => api.post(`/creators/${creatorId}/domains/`, d);
export const updateCreatorDomain = (creatorId, id, d) => api.patch(`/creators/${creatorId}/domains/${id}/`, d);
export const deleteCreatorDomain = (creatorId, id) => api.delete(`/creators/${creatorId}/domains/${id}/`);

// Creator Charges (platform × ad format pricing)
export const getCreatorCharges = (creatorId) => api.get(`/creators/${creatorId}/charges/`);
export const createCreatorCharge = (creatorId, d) => api.post(`/creators/${creatorId}/charges/`, d);
export const updateCreatorCharge = (creatorId, id, d) => api.patch(`/creators/${creatorId}/charges/${id}/`, d);
export const deleteCreatorCharge = (creatorId, id) => api.delete(`/creators/${creatorId}/charges/${id}/`);

// Media Kits
export const getMediaKits = (creatorId) => api.get(`/creators/${creatorId}/media-kits/`);
export const createMediaKit = (creatorId, d) => api.post(`/creators/${creatorId}/media-kits/`, d);
export const updateMediaKit = (creatorId, id, d) => api.patch(`/creators/${creatorId}/media-kits/${id}/`, d);
export const getMediaKitLinks = (mkId) => api.get(`/creators/media-kits/${mkId}/links/`);
export const createMediaKitLink = (mkId, d) => api.post(`/creators/media-kits/${mkId}/links/`, d);
export const deleteMediaKitLink = (mkId, id) => api.delete(`/creators/media-kits/${mkId}/links/${id}/`);

// Campaigns
export const getCampaigns = (p) => api.get("/campaigns/", { params: p });
export const getCampaign = (id) => api.get(`/campaigns/${id}/`);
export const createCampaign = (d) => api.post("/campaigns/", d);
export const updateCampaign = (id, d) => api.patch(`/campaigns/${id}/`, d);
export const deleteCampaign = (id) => api.delete(`/campaigns/${id}/`);
export const transitionCampaign = (id, d) => api.post(`/campaigns/${id}/transition/`, d);

// Campaign Briefs
export const getCampaignBriefs = (cId) => api.get(`/campaigns/${cId}/briefs/`);
export const createCampaignBrief = (cId, d) => api.post(`/campaigns/${cId}/briefs/`, d);
export const updateCampaignBrief = (cId, id, d) => api.patch(`/campaigns/${cId}/briefs/${id}/`, d);
export const approveCampaignBrief = (cId, id) => api.post(`/campaigns/${cId}/briefs/${id}/approve/`);

// Brief Templates
export const getBriefTemplates = (p) => api.get("/campaigns/brief-templates/", { params: p });
export const createBriefTemplate = (d) => api.post("/campaigns/brief-templates/", d);
export const updateBriefTemplate = (id, d) => api.patch(`/campaigns/brief-templates/${id}/`, d);
export const deleteBriefTemplate = (id) => api.delete(`/campaigns/brief-templates/${id}/`);

// Deliverables
export const getDeliverables = (cId) => api.get(`/campaigns/${cId}/deliverables/`);
export const createDeliverable = (cId, d) => api.post(`/campaigns/${cId}/deliverables/`, d);
export const updateDeliverable = (cId, id, d) => api.patch(`/campaigns/${cId}/deliverables/${id}/`, d);
export const deleteDeliverable = (cId, id) => api.delete(`/campaigns/${cId}/deliverables/${id}/`);

// Content Revisions & Comments
export const getContentRevisions = (contentId) => api.get(`/campaigns/content/${contentId}/revisions/`);
export const createContentRevision = (contentId, d) => api.post(`/campaigns/content/${contentId}/revisions/`, d);
export const getContentComments = (contentId) => api.get(`/campaigns/content/${contentId}/comments/`);
export const createContentComment = (contentId, d) => api.post(`/campaigns/content/${contentId}/comments/`, d);

// Campaign Expenses
export const getCampaignExpenses = (cId) => api.get(`/campaigns/${cId}/expenses/`);
export const createCampaignExpense = (cId, d) => api.post(`/campaigns/${cId}/expenses/`, d);
export const updateCampaignExpense = (cId, id, d) => api.patch(`/campaigns/${cId}/expenses/${id}/`, d);
export const deleteCampaignExpense = (cId, id) => api.delete(`/campaigns/${cId}/expenses/${id}/`);

// Expense Categories
export const getExpenseCategories = () => api.get("/campaigns/expense-categories/");
export const createExpenseCategory = (d) => api.post("/campaigns/expense-categories/", d);

// Campaign Templates
export const getCampaignTemplates = (p) => api.get("/campaigns/campaign-templates/", { params: p });
export const createCampaignTemplate = (d) => api.post("/campaigns/campaign-templates/", d);
export const updateCampaignTemplate = (id, d) => api.patch(`/campaigns/campaign-templates/${id}/`, d);
export const deleteCampaignTemplate = (id) => api.delete(`/campaigns/campaign-templates/${id}/`);
export const cloneCampaignFromTemplate = (id, d) => api.post(`/campaigns/campaign-templates/${id}/clone/`, d);

// Campaign Deadlines & Calendar
export const getCampaignDeadlines = (cId) => api.get(`/campaigns/${cId}/deadlines/`);
export const createCampaignDeadline = (cId, d) => api.post(`/campaigns/${cId}/deadlines/`, d);
export const updateCampaignDeadline = (cId, id, d) => api.patch(`/campaigns/${cId}/deadlines/${id}/`, d);
export const completeCampaignDeadline = (cId, id) => api.post(`/campaigns/${cId}/deadlines/${id}/complete/`);
export const getCalendar = (p) => api.get("/campaigns/calendar/", { params: p });

// Creator Availability
export const getCreatorAvailability = (p) => api.get("/campaigns/availability/", { params: p });
export const createCreatorAvailability = (d) => api.post("/campaigns/availability/", d);
export const deleteCreatorAvailability = (id) => api.delete(`/campaigns/availability/${id}/`);

// Brand Exclusivity
export const getBrandExclusivities = (p) => api.get("/campaigns/exclusivities/", { params: p });
export const createBrandExclusivity = (d) => api.post("/campaigns/exclusivities/", d);
export const deleteBrandExclusivity = (id) => api.delete(`/campaigns/exclusivities/${id}/`);

// Creator-Brand Preferences
export const getCreatorBrandPreferences = (p) => api.get("/campaigns/preferences/", { params: p });
export const createCreatorBrandPreference = (d) => api.post("/campaigns/preferences/", d);
export const updateCreatorBrandPreference = (id, d) => api.patch(`/campaigns/preferences/${id}/`, d);

// Payouts
export const getPayouts = (p) => api.get("/payouts/", { params: p });
export const getPayout = (id) => api.get(`/payouts/${id}/`);
export const createPayout = (d) => api.post("/payouts/", d);
export const updatePayout = (id, d) => api.patch(`/payouts/${id}/`, d);
export const approvePayout = (id, d) => api.post(`/payouts/${id}/approve/`, d);
export const getInvoices = (p) => api.get("/payouts/invoices/", { params: p });

// Config — Platforms (global + client)
export const getPlatforms = () => api.get("/config/platforms/");
export const createPlatform = (d) => api.post("/config/platforms/", d);
export const updatePlatform = (id, d) => api.patch(`/config/platforms/${id}/`, d);
export const deletePlatform = (id) => api.delete(`/config/platforms/${id}/`);

// Config — Domains
export const getDomains = () => api.get("/config/domains/");
export const createDomain = (d) => api.post("/config/domains/", d);
export const updateDomain = (id, d) => api.patch(`/config/domains/${id}/`, d);
export const deleteDomain = (id) => api.delete(`/config/domains/${id}/`);

// Config — Business Types
export const getBusinessTypes = () => api.get("/config/business-types/");
export const createBusinessType = (d) => api.post("/config/business-types/", d);
export const updateBusinessType = (id, d) => api.patch(`/config/business-types/${id}/`, d);
export const deleteBusinessType = (id) => api.delete(`/config/business-types/${id}/`);

// Config — Ad Formats (global + client)
export const getAdFormats = (p) => api.get("/config/ad-formats/", { params: p });
export const createAdFormat = (d) => api.post("/config/ad-formats/", d);
export const updateAdFormat = (id, d) => api.patch(`/config/ad-formats/${id}/`, d);
export const deleteAdFormat = (id) => api.delete(`/config/ad-formats/${id}/`);

// Tags
export const getTags = (p) => api.get("/config/tags/", { params: p });
export const createTag = (d) => api.post("/config/tags/", d);
export const updateTag = (id, d) => api.patch(`/config/tags/${id}/`, d);
export const deleteTag = (id) => api.delete(`/config/tags/${id}/`);
export const getTagMappings = (p) => api.get("/config/tag-mappings/", { params: p });
export const createTagMapping = (d) => api.post("/config/tag-mappings/", d);
export const deleteTagMapping = (id) => api.delete(`/config/tag-mappings/${id}/`);

// Notes / Activity Feed
export const getNotes = (p) => api.get("/notes/", { params: p });
export const createNote = (d) => api.post("/notes/", d);
export const updateNote = (id, d) => api.patch(`/notes/${id}/`, d);
export const deleteNote = (id) => api.delete(`/notes/${id}/`);

// Notifications
export const getNotifications = (p) => api.get("/notifications/", { params: p });
export const markNotificationRead = (id) => api.post(`/notifications/${id}/read/`);
export const markAllNotificationsRead = () => api.post("/notifications/read-all/");
export const getUnreadCount = () => api.get("/notifications/unread_count/");

// Notification Templates
export const getNotificationTemplates = (p) => api.get("/notifications/templates/", { params: p });
export const createNotificationTemplate = (d) => api.post("/notifications/templates/", d);
export const updateNotificationTemplate = (id, d) => api.patch(`/notifications/templates/${id}/`, d);
export const deleteNotificationTemplate = (id) => api.delete(`/notifications/templates/${id}/`);

// Reports
export const getDashboard = () => api.get("/reports/dashboard/");
export const getCampaignReport = (p) => api.get("/reports/campaigns/", { params: p });
export const getCreatorReport = (p) => api.get("/reports/creators/", { params: p });
export const getBrandReport = (p) => api.get("/reports/brands/", { params: p });
export const getFinancialReport = (p) => api.get("/reports/financial/", { params: p });
export const getBrandPerformance = (p) => api.get("/reports/brand-performance/", { params: p });
export const getCreatorPerformance = (p) => api.get("/reports/creator-performance/", { params: p });

// Audit
export const getAuditLogs = (p) => api.get("/audit/", { params: p });

// Super Admin
export const getClients = (p) => api.get("/admin/clients/", { params: p });
export const createClient = (d) => api.post("/admin/clients/", d);
export const getPlatformStats = () => api.get("/admin/platform-stats/");
export const getPlans = (p) => api.get("/admin/plans/", { params: p });
export const createPlan = (d) => api.post("/admin/plans/", d);
