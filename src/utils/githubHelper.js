const axios = require('axios');
require('dotenv').config();

const GITHUB_API_BASE = 'https://api.github.com';

const githubAPI = axios.create({
  baseURL: GITHUB_API_BASE,
  headers: {
    Accept: 'application/vnd.github.v3+json',
    ...(process.env.GITHUB_TOKEN && {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    }),
  },
  timeout: 10000,
});

const fetchUserProfile = async (username) => {
  const response = await githubAPI.get(`/users/${username}`);
  return response.data;
};

const fetchUserRepos = async (username) => {
  let allRepos = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const response = await githubAPI.get(`/users/${username}/repos`, {
      params: { per_page: perPage, page, sort: 'updated' },
    });
    allRepos = allRepos.concat(response.data);
    if (response.data.length < perPage) break;
    page++;
    if (page > 10) break; // Safety: max 1000 repos
  }

  return allRepos;
};

const analyzeRepos = (repos) => {
  if (!repos || repos.length === 0) {
    return {
      total_stars: 0,
      total_forks: 0,
      total_watchers: 0,
      total_open_issues: 0,
      most_used_language: null,
      top_languages: {},
      top_repos: [],
      avg_repo_size: 0,
      has_forked_repos: false,
      original_repo_count: 0,
      forked_repo_count: 0,
    };
  }

  const languageCount = {};
  let totalStars = 0;
  let totalForks = 0;
  let totalWatchers = 0;
  let totalOpenIssues = 0;
  let totalSize = 0;
  let forkedCount = 0;

  repos.forEach((repo) => {
    totalStars += repo.stargazers_count || 0;
    totalForks += repo.forks_count || 0;
    totalWatchers += repo.watchers_count || 0;
    totalOpenIssues += repo.open_issues_count || 0;
    totalSize += repo.size || 0;

    if (repo.fork) {
      forkedCount++;
    }

    if (repo.language) {
      languageCount[repo.language] = (languageCount[repo.language] || 0) + 1;
    }
  });

  const sortedLanguages = Object.entries(languageCount)
    .sort((a, b) => b[1] - a[1])
    .reduce((acc, [lang, count]) => {
      acc[lang] = count;
      return acc;
    }, {});

  const mostUsedLanguage =
    Object.keys(sortedLanguages).length > 0 ? Object.keys(sortedLanguages)[0] : null;

  const topRepos = repos
    .filter((r) => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 5)
    .map((r) => ({
      name: r.name,
      description: r.description,
      stars: r.stargazers_count,
      forks: r.forks_count,
      language: r.language,
      url: r.html_url,
    }));

  return {
    total_stars: totalStars,
    total_forks: totalForks,
    total_watchers: totalWatchers,
    total_open_issues: totalOpenIssues,
    most_used_language: mostUsedLanguage,
    top_languages: sortedLanguages,
    top_repos: topRepos,
    avg_repo_size: repos.length > 0 ? parseFloat((totalSize / repos.length).toFixed(2)) : 0,
    has_forked_repos: forkedCount > 0,
    original_repo_count: repos.length - forkedCount,
    forked_repo_count: forkedCount,
  };
};

module.exports = { fetchUserProfile, fetchUserRepos, analyzeRepos };
