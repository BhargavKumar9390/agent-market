/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		serverActions: true,
	},
	eslint: {
		// Prevent ESLint errors from failing production builds
		ignoreDuringBuilds: true,
	},
};

export default nextConfig;
