const fs = require('fs');
const path = require('path');

// Brightness to Commit Count Mapping
const COMMIT_COUNTS = {
    0: 0,
    1: 3,   // Level 1: Light (1-3)
    2: 7,   // Level 2: Medium (4-9)
    3: 15,  // Level 3: Dark (10-19)
    4: 30   // Level 4: Max (20+)
};

function generateCommitScript(pixels) {
    let script = '#!/bin/bash\n';
    script += 'git checkout --orphan display-layer || git checkout display-layer\n';
    script += 'git reset --hard\n';
    script += 'git clean -fdx\n'; // Be careful, this cleans everything not ignored. 

    // We actually want to keep the .github workflows if they are on this branch, 
    // but usually display layer is just dummy history.
    // Better strategy: generate commits in a way that doesn't rely on existing files.

    // Date Logic
    // We want the grid to end "Today" or nearest Saturday/Sunday?
    // GitHub graph is Sunday-based usually.
    // Let's assume the right-most column matches the current week.

    const today = new Date();
    // Normalize to noon to avoid DST issues
    today.setHours(12, 0, 0, 0);

    // Find the current day of week (0=Sun, 6=Sat)
    const currentDay = today.getDay();

    // Align end of grid. 
    // The grid has `width` columns.
    // GitHub graph shows last year.
    // We want to render the grid at the END of the graph (recent).
    // So the last column of pixels should align with 'This Week'.

    const height = pixels.length; // 7 rows
    const width = pixels[0].length; // N columns

    // Iterate columns from right to left (Time: Recent -> Past)
    // Actually, easier to iterate normally and mapping to dates.

    // Let's say column (width-1) is THIS week.
    // Column 0 is (width-1) weeks ago.

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const brightness = pixels[y][x];
            const commitsNeeded = COMMIT_COUNTS[brightness] || 0;

            if (commitsNeeded === 0) continue;

            // Calculate Date
            // y=0 is Sunday, y=6 is Saturday.

            // The "Rightmost" column (x = width-1) represents this week?
            // Let's align such that:
            // The last column's Current Day row matches Today.

            // Offset from today in days:
            // Days Diff = (width - 1 - x) * 7 + (currentDay - y)
            // Wait, this logic is tricky because rows are absolute days of week.

            // Let's anchor: 
            // Col X, Row Y corresponds to a specific date.
            // Today is Week W, Day D.

            // A cell at Loop Column X, Loop Row Y.
            // Weeks ago = (width - 1) - x.
            // Days difference = (Weeks ago * 7) + (currentDay - y) ?? No.

            // Let's calculate the date of the "Sunday" of the week for Column X.
            // Current week's Sunday:

            const daysSinceSunday = today.getDay();
            const currentWeekSunday = new Date(today);
            currentWeekSunday.setDate(today.getDate() - daysSinceSunday);

            // Column X's Sunday (assuming X=width-1 is current week)
            const weeksAgo = (width - 1) - x;
            const targetSunday = new Date(currentWeekSunday);
            targetSunday.setDate(currentWeekSunday.getDate() - (weeksAgo * 7));

            // Target Date for Row Y (0=Sun, 1=Mon...)
            const targetDate = new Date(targetSunday);
            targetDate.setDate(targetSunday.getDate() + y);

            // Format ISO
            const dateStr = targetDate.toISOString();

            // Generate Commits
            script += `echo "Commit for ${dateStr} level ${brightness}"\n`;
            for (let i = 0; i < commitsNeeded; i++) {
                // Changing GIT_AUTHOR_DATE and GIT_COMMITTER_DATE
                script += `GIT_AUTHOR_DATE="${dateStr}" GIT_COMMITTER_DATE="${dateStr}" git commit --allow-empty -m "p"\n`;
            }
        }
    }

    return script;
}

module.exports = { generateCommitScript };
