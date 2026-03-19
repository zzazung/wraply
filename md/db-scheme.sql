-- =========================================
-- TENANTS
-- =========================================
CREATE TABLE tenants (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_user_id VARCHAR(36) NOT NULL,
  created_at DATETIME,
  updated_at DATETIME
);

-- =========================================
-- USERS (Multi-tenant)
-- =========================================
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME,
  updated_at DATETIME,

  CONSTRAINT fk_users_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    ON DELETE CASCADE,

  UNIQUE KEY uniq_users_email_tenant (email, tenant_id),
  INDEX idx_users_tenant_id (tenant_id)
);

-- =========================================
-- PROJECTS
-- =========================================
CREATE TABLE projects (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  safe_name VARCHAR(255) NOT NULL,
  package_name VARCHAR(255) NOT NULL,
  bundle_id VARCHAR(255),
  created_at DATETIME,
  updated_at DATETIME,

  CONSTRAINT fk_projects_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    ON DELETE CASCADE,

  INDEX idx_projects_tenant_id (tenant_id)
);

-- =========================================
-- JOBS
-- =========================================
CREATE TABLE jobs (
  job_id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) NOT NULL,

  platform VARCHAR(20) NOT NULL,
  package_name VARCHAR(255) NOT NULL,
  safe_name VARCHAR(255) NOT NULL,
  app_name VARCHAR(255),
  url TEXT,
  scheme VARCHAR(50),

  status VARCHAR(50),
  progress INT,

  worker_id VARCHAR(100),
  build_host VARCHAR(255),

  log_path TEXT,
  artifact_dir TEXT,

  heartbeat_at DATETIME,
  created_at DATETIME,
  updated_at DATETIME,
  finished_at DATETIME,
  error_reason TEXT,

  CONSTRAINT fk_jobs_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_jobs_project
    FOREIGN KEY (project_id) REFERENCES projects(id)
    ON DELETE CASCADE,

  INDEX idx_jobs_tenant_id (tenant_id),
  INDEX idx_jobs_project_id (project_id),
  INDEX idx_jobs_status (status)
);

-- =========================================
-- ARTIFACTS
-- =========================================
CREATE TABLE artifacts (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  job_id VARCHAR(36) NOT NULL,

  platform VARCHAR(20),
  name VARCHAR(255),
  path TEXT,
  size BIGINT,

  created_at DATETIME,

  CONSTRAINT fk_artifacts_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_artifacts_job
    FOREIGN KEY (job_id) REFERENCES jobs(job_id)
    ON DELETE CASCADE,

  INDEX idx_artifacts_tenant_id (tenant_id),
  INDEX idx_artifacts_job_id (job_id)
);

-- =========================================
-- ANDROID SIGNING
-- =========================================
CREATE TABLE android_signing_keys (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) NOT NULL,

  keystore_path TEXT,
  alias VARCHAR(255),

  created_at DATETIME,

  CONSTRAINT fk_android_signing_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_android_signing_project
    FOREIGN KEY (project_id) REFERENCES projects(id)
    ON DELETE CASCADE,

  INDEX idx_android_signing_tenant_id (tenant_id)
);

-- =========================================
-- IOS SIGNING
-- =========================================
CREATE TABLE ios_signing_assets (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,

  bundle_id VARCHAR(255),

  cert_path TEXT,
  profile_path TEXT,

  created_at DATETIME,

  CONSTRAINT fk_ios_signing_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    ON DELETE CASCADE,

  INDEX idx_ios_signing_tenant_id (tenant_id)
);

-- =========================================
-- BILLING
-- =========================================
CREATE TABLE billing (
  tenant_id VARCHAR(36) PRIMARY KEY,

  plan VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  current_period_end DATETIME,

  created_at DATETIME,
  updated_at DATETIME,

  CONSTRAINT fk_billing_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    ON DELETE CASCADE
);