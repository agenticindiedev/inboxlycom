import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: ['@agenticindiedev/ui'],
  sassOptions: {
    includePaths: [path.join(__dirname, 'node_modules')],
    silenceDeprecations: ['import'],
  },
  // Empty turbopack config to acknowledge we have webpack config but want Turbopack
  turbopack: {},
  webpack: (config) => {
    // Configure sass-loader to resolve @agenticindiedev/ui package imports
    const rules = config.module.rules;
    const scssRule = rules.find(
      (rule: unknown) =>
        rule &&
        typeof rule === 'object' &&
        rule !== null &&
        'test' in rule &&
        rule.test &&
        typeof rule.test === 'object' &&
        'toString' in rule.test &&
        rule.test.toString().includes('scss'),
    );

    if (
      scssRule &&
      typeof scssRule === 'object' &&
      scssRule !== null &&
      'oneOf' in scssRule &&
      Array.isArray(scssRule.oneOf)
    ) {
      scssRule.oneOf.forEach((oneOf: unknown) => {
        if (
          oneOf &&
          typeof oneOf === 'object' &&
          oneOf !== null &&
          'use' in oneOf &&
          Array.isArray(oneOf.use)
        ) {
          oneOf.use.forEach((loader: unknown) => {
            if (
              loader &&
              typeof loader === 'object' &&
              loader !== null &&
              'loader' in loader &&
              typeof loader.loader === 'string' &&
              loader.loader.includes('sass-loader')
            ) {
              const loaderWithOptions = loader as {
                options?: {
                  api?: string;
                  sassOptions?: Record<string, unknown>;
                };
              };
              loaderWithOptions.options = {
                ...loaderWithOptions.options,
                api: 'modern-compiler',
                sassOptions: {
                  ...loaderWithOptions.options?.sassOptions,
                  includePaths: [path.join(__dirname, 'node_modules')],
                },
              };
            }
          });
        }
      });
    }

    return config;
  },
};

export default nextConfig;
