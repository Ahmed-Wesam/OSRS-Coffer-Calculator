// GitHub Actions environment configuration

interface Config {
  NETLIFY_AUTH_TOKEN?: string
  NETLIFY_SITE_ID?: string
  VERCEL_ORG_ID?: string
  VERCEL_PROJECT_ID?: string
  VERCEL_TOKEN?: string
  NODE_ENV: string
}

export const config: Config = {
  NETLIFY_AUTH_TOKEN: process.env.NETLIFY_AUTH_TOKEN,
  NETLIFY_SITE_ID: process.env.NETLIFY_SITE_ID,
  VERCEL_ORG_ID: process.env.VERCEL_ORG_ID,
  VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID,
  VERCEL_TOKEN: process.env.VERCEL_TOKEN,
  NODE_ENV: process.env.NODE_ENV || 'development'
};

// Validate required secrets in production
if (config.NODE_ENV === 'production') {
  const requiredSecrets: (keyof Config)[] = ['NETLIFY_AUTH_TOKEN', 'NETLIFY_SITE_ID', 'VERCEL_ORG_ID', 'VERCEL_PROJECT_ID', 'VERCEL_TOKEN'];
  const missingSecrets = requiredSecrets.filter(secret => !config[secret]);
  
  if (missingSecrets.length > 0) {
    console.error(`❌ Missing required secrets: ${missingSecrets.join(', ')}`);
    process.exit(1);
  }
  
  console.log('✅ All required secrets are available');
}

export default config;
