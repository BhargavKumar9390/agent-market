/** @type {import('next').NextConfig} */
const nextConfig = {
	eslint: {
		// Prevent ESLint errors from failing production builds
		ignoreDuringBuilds: true,
	},
};

export default nextConfig;
