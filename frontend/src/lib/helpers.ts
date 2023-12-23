import { DateTime } from 'luxon';
import type { PlexDebridItem } from '$lib/types';

// only works with real-debrid dates because of CET format provided by RD
export function formatRDDate(inputDate: string, format: string = 'long'): string {
	let cetDate = DateTime.fromISO(inputDate, { zone: 'Europe/Paris' });
	cetDate = cetDate.setZone('utc');

	const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	cetDate = cetDate.setZone(userTimeZone);

	let formattedDate;
	if (format === 'short') {
		formattedDate = cetDate.toLocaleString({
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	} else {
		formattedDate = cetDate.toLocaleString(DateTime.DATETIME_FULL);
	}

	return formattedDate;
}

export function formatDate(
	inputDate: string,
	format: string = 'long',
	relative: boolean = false
): string {
	let date = DateTime.fromISO(inputDate, { zone: 'utc' });
	date = date.setZone('local');

	let formattedDate;

	if (relative) {
		formattedDate = date.toRelative() || '';
	} else {
		if (format === 'short') {
			formattedDate = date.toLocaleString({
				year: 'numeric',
				month: 'short',
				day: 'numeric'
			});
		} else {
			formattedDate = date.toLocaleString(DateTime.DATETIME_FULL);
		}
	}

	return formattedDate;
}

export function formatWords(words: string) {
	return words
		.split('_')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
}

export function convertPlexDebridItemsToObject(items: PlexDebridItem[]) {
	const result: { [key: string]: PlexDebridItem[] } = {};

	for (const item of items) {
		if (!result[item.state]) {
			result[item.state] = [];
		}
		result[item.state].push(item);
	}

	return result;
}

export async function getSettings(fetch: any, toGet: string[]) {
	const promises = toGet.map(async (item) => {
		const res = await fetch(`http://127.0.0.1:8080/settings/get/${item}`);
		if (res.ok) {
			return await res.json();
		}
		return null;
	});

	const results = (await Promise.all(promises)).reduce((acc, item, index) => {
		acc[toGet[index]] = item;
		return acc;
	}, {});

	return results;
}

export async function setSettings(fetch: any, toSet: any) {
	const promises = Object.keys(toSet).map(async (item) => {
		const res = await fetch('http://127.0.0.1:8080/settings/set', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ key: item, value: toSet[item] })
		});
		if (res.ok) {
			return await res.json();
		}
		return null;
	});

	const resp = await Promise.all(promises);

	const saveSettings = await fetch('http://127.0.0.1:8080/settings/save', {
		method: 'POST'
	});
	const loadSettings = await fetch('http://127.0.0.1:8080/settings/load');

	return { resp, saveSettings, loadSettings };
}
