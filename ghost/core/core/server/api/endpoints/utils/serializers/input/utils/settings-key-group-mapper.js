// NOTE: mapping is based on maping present in migration - 3.22/04-populate-settings-groups-and-flags
const keyGroupMapping = {
  members_public_key: 'core',
  members_private_key: 'core',
  members_email_auth_secret: 'core',
  db_hash: 'core',
  next_update_check: 'core',
  notifications: 'core',
  admin_session_secret: 'core',
  theme_session_secret: 'core',
  ghost_public_key: 'core',
  ghost_private_key: 'core',
  title: 'site',
  description: 'site',
  logo: 'site',
  cover_image: 'site',
  icon: 'site',
  accent_color: 'site',
  locale: 'site',
  timezone: 'site',
  codeinjection_head: 'site',
  codeinjection_foot: 'site',
  facebook: 'site',
  twitter: 'site',
  navigation: 'site',
  secondary_navigation: 'site',
  meta_title: 'site',
  meta_description: 'site',
  og_image: 'site',
  og_title: 'site',
  og_description: 'site',
  twitter_image: 'site',
  twitter_title: 'site',
  twitter_description: 'site',
  active_theme: 'theme',
  is_private: 'private',
  password: 'private',
  public_hash: 'private',
  amp: 'amp',
  labs: 'labs',
  slack: 'slack',
  unsplash: 'unsplash',
  shared_views: 'views',
  bulk_email_settings: 'email',
  default_content_visibility: 'members',
  members_subscription_settings: 'members',
  stripe_connect_integration: 'members',
  portal_name: 'portal',
  portal_button: 'portal',
  portal_plans: 'portal',
};

const mapKeyToGroup = (key) => {
  return keyGroupMapping[key];
};

module.exports = mapKeyToGroup;
