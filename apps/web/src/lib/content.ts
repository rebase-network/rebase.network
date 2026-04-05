import type { Article, Event, GeekDailyEpisode, Job } from '@rebase/types';
import { articles } from '@/data/articles';
import { contributors, contributorRoles } from '@/data/contributors';
import { events } from '@/data/events';
import { geekdailyEpisodes } from '@/data/geekdaily';
import { homeSignals, homeStats, siteSettings, aboutIntro, aboutSections } from '@/data/site';
import { jobs } from '@/data/jobs';

export function getSiteSettings() {
  return siteSettings;
}

export function getHomeSignals() {
  return homeSignals;
}

export function getHomeStats() {
  return homeStats;
}

export function getAboutContent() {
  return {
    intro: aboutIntro,
    sections: aboutSections,
  };
}

export function getArticles(): Article[] {
  return [...articles].sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
}

export function getArticleBySlug(slug: string) {
  return getArticles().find((item) => item.slug === slug);
}

export function getJobs(): Job[] {
  return [...jobs].sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
}

export function getJobBySlug(slug: string) {
  return getJobs().find((item) => item.slug === slug);
}

export function getEvents(): Event[] {
  return [...events].sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt));
}

export function getEventBySlug(slug: string) {
  return getEvents().find((item) => item.slug === slug);
}

export function getUpcomingEvents() {
  return getEvents().filter((item) => item.status === 'upcoming');
}

export function getPastEvents() {
  return getEvents()
    .filter((item) => item.status === 'past')
    .sort((a, b) => +new Date(b.startAt) - +new Date(a.startAt));
}

export function getContributors() {
  return contributors;
}

export function getContributorRoles() {
  return contributorRoles;
}

export function getContributorsByRole() {
  return contributorRoles.map((role) => ({
    role,
    contributors: contributors.filter((person) => person.roleSlugs.includes(role.slug)),
  }));
}

export function getGeekDailyEpisodes(): GeekDailyEpisode[] {
  return [...geekdailyEpisodes].sort((a, b) => b.episodeNumber - a.episodeNumber);
}

export function getGeekDailyEpisodeBySlug(slug: string) {
  return getGeekDailyEpisodes().find((episode) => episode.slug === slug);
}

export function getLatestArticles(count = 3) {
  return getArticles().slice(0, count);
}

export function getLatestJobs(count = 3) {
  return getJobs().slice(0, count);
}

export function getLatestGeekDaily(count = 3) {
  return getGeekDailyEpisodes().slice(0, count);
}

export function getLatestUpcomingEvents(count = 2) {
  return getUpcomingEvents().slice(0, count);
}

export function getHomeFeed() {
  return {
    latestArticles: getLatestArticles(),
    latestJobs: getLatestJobs(),
    latestEvents: getLatestUpcomingEvents(),
    latestGeekDaily: getLatestGeekDaily(1)[0],
  };
}
