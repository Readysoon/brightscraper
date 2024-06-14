// website_adder.js
import puppeteer from "puppeteer-core";
import fs from 'fs';

async function addWebsites() {
    let browser;
    try {
        const auth = 'brd-customer-hl_14153ca9-zone-scraping_browser1:pk6zymx36is9';
        
        browser = await puppeteer.connect({
            browserWSEndpoint: `wss://${auth}@brd.superproxy.io:9222`
        });

        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(2 * 60 * 1000);

        // Read the JSON file with the list of doctors
        const data = fs.readFileSync('uniqueDoctorsData.json', 'utf-8');
        const doctorsData = JSON.parse(data);

        // Iterate through each doctor, visit their profile, and add the website to their data
        for (let doctor of doctorsData) {
            console.log(`Visiting profile of ${doctor.name} at ${doctor.link}`);

            // Introduce a short delay between navigations to avoid hitting the page limit
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
            console.log(`Waited for 1000ms`);

            // Use a new page for each doctor's profile to avoid navigation limit on the same page
            const profilePage = await browser.newPage();
            await profilePage.goto(doctor.link, { waitUntil: 'networkidle2' });

            // Extract the doctor's website from their profile page
            const website = await profilePage.evaluate(() => {
                const websiteElement = document.querySelector('a[rel="nofollow"][target="_blank"]');
                return websiteElement ? websiteElement.href : null;
            });

            // Add the website to the doctor's data
            doctor.website = website;

            console.log(`Extracted website for ${doctor.name}: ${website}`);

            // Close the profile page to free up resources
            await profilePage.close();
        }

        // Save the updated doctors data back to a JSON file
        fs.writeFileSync('updatedDoctorsData.json', JSON.stringify(doctorsData, null, 2), 'utf-8');

        console.log('Updated doctors data with websites saved to updatedDoctorsData.json');

    } catch (e) {
        console.error('Failed to add websites', e);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Export the function to be used in index.js
export { addWebsites };
