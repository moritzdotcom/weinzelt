/** @type {import('next-sitemap').IConfig} */

module.exports = {
  siteUrl: 'https://dasweinzelt.de',
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  generateRobotsTxt: true,
  exclude: ['/backend', '/backend/*'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
  },
};
