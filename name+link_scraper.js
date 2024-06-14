// scraper.js
import puppeteer from "puppeteer-core";
import fs from 'fs';

export async function runScraper() {
    let browser;
    try {
        const auth = 'brd-customer-hl_14153ca9-zone-scraping_browser1:pk6zymx36is9';
        
        browser = await puppeteer.connect({
            browserWSEndpoint: `wss://${auth}@brd.superproxy.io:9222`
        });
        
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(2 * 60 * 1000);
        
        // Visit the target page
        await page.goto('https://www.doctolib.de/teilfachgebiet-orthopaedie/bayern', { waitUntil: 'networkidle2' });
        
        // Wait for the results count to be loaded in the DOM
        await page.waitForSelector('div.dl-text.dl-text-body.dl-text-bold.dl-text-s.dl-text-neutral-150[data-test="total-number-of-results"]', {
            timeout: 60 * 1000 // Wait up to 60 seconds
        });

        // Extract the total number of results
        const totalResults = await page.evaluate(() => {
            // Select the div containing the total number of results
            const resultsElement = document.querySelector('div.dl-text.dl-text-body.dl-text-bold.dl-text-s.dl-text-neutral-150[data-test="total-number-of-results"]');
            // Extract the number and convert it to an integer
            return parseInt(resultsElement.innerText.replace(/\D/g, ''));
        });

        console.log(`Total number of results: ${totalResults}`);

        // Calculate the number of pages
        const resultsPerPage = 20;
        const totalPages = Math.ceil(totalResults / resultsPerPage);

        console.log(`Total number of pages: ${totalPages}`);

        // Define the set to store unique doctor links outside the loop
        const uniqueDoctorLinks = new Set();

        for (let i = 1; i <= totalPages; i++) {
            console.log(`Processing page ${i} of ${totalPages}`);

            // Visit each page
            await page.goto(`https://www.doctolib.de/teilfachgebiet-orthopaedie/bayern?page=${i}`, { waitUntil: 'networkidle2' });

            // Wait for the doctor links to be loaded in the DOM
            await page.waitForSelector('a.dl-p-doctor-result-link.dl-full-width.dl-flex-center', {
                timeout: 60 * 1000 // Wait up to 60 seconds
            });

            // Extract the doctor names and links from all matching elements
            const doctorsData = await page.evaluate(() => {
                // Select all doctor result links
                const doctorElements = document.querySelectorAll('a.dl-p-doctor-result-link.dl-full-width.dl-flex-center');
                // Map over each element to extract the name and href
                return Array.from(doctorElements).map(doctorElement => {
                    const nameElement = doctorElement.querySelector('h2.dl-text.dl-text-body.dl-text-bold.dl-text-s.dl-text-primary-110');
                    const name = nameElement ? nameElement.innerText.trim() : null;
                    const href = `https://www.doctolib.de${doctorElement.getAttribute('href')}`;

                    return name ? { name: name, link: href } : null;
                    
                }).filter(doctor => doctor !== null); // Filter out entries with empty names

            });

            console.log(`Saved Names and Links to Array`);

            // Add unique doctor links to the set
            doctorsData.forEach(doctor => uniqueDoctorLinks.add(JSON.stringify(doctor)));

            // Optional: Log partial results if needed
            // console.log('Partial Unique Doctors Data:', Array.from(uniqueDoctorLinks).map(doctor => JSON.parse(doctor)));
        }

        // Convert the set back to an array and parse JSON strings after processing all pages
        const uniqueDoctorsArray = Array.from(uniqueDoctorLinks).map(doctor => JSON.parse(doctor));

        console.log('Final Unique Doctors Data:', uniqueDoctorsArray);

        // Save the unique doctors data to a JSON file
        fs.writeFileSync('uniqueDoctorsData.json', JSON.stringify(uniqueDoctorsArray, null, 2), 'utf-8');

    } catch (e) {
        console.error('Scrape failed', e);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
