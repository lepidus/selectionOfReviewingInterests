# Selection Field in Reviewing Interests Area

This plugin adds a selection field in the Reviewing Interests Area, with options defined from the plugin settings.

Reviewers are redirected to the Reviewing Interests Area when they log in, if they have no reviewing interests defined.

## Features

### 1. Configured Interest Selection in User Profile
Reviewers can only select from the interests configured in the plugin settings, rather than entering free text.

### 2. Interest Filter in Reviewer Selection (NEW)
When editors/managers add a reviewer to a submission, they can now filter reviewers by their reviewing interests. This new feature allows selecting one or more interests to display only reviewers who have those interests configured.

#### How it Works:
1. Navigate to a submission's workflow
2. Click "Add Reviewer" button
3. In the reviewer selection modal, find the "Reviewing Interests" filter
4. Select one or more interests from the checkboxes
5. The reviewer list will be filtered to show only reviewers with any of the selected interests
6. Combine with other filters (rating, completion time, etc.) for more precise filtering

## Compatibility

This plugin is compatible with OJS in the following versions:

- 3.3.0.x (v1)
- 3.4.0.x (v2)
- 3.5.0.x (v2 and later)

## Plugin Download

To download the plugin, go to the Releases page and download the tar.gz package of the latest release.

## Installation

Enter the administration area of ​​your OJS website through the Dashboard.
Navigate to `Settings` > `Website` > `Plugins` > `Upload a new plugin`.

Under Upload file select the file `selectionOfReviewingInterests.tar.gz`.

Click Save and the plugin will be installed on your website.

## Configuration

After installation and enablement of the plugin:

1. Navigate to `Settings` > `Website` > `Plugins`
2. Find "Selection Field in Reviewing Interests Area" in the plugins list
3. Click the "Settings" link to configure the plugin
4. Add the reviewing interests/areas that reviewers can select from
5. Save the configuration

These configured interests will now be available:
- In the reviewer profile (restricted selection)
- In the reviewer selection modal when adding reviewers (as a filter)

## Usage

### For Reviewers
- When logging in, if you have no interests selected, you'll be prompted to select at least one
- Go to your profile, find the "Reviewing Interests" field
- Select from the predefined options (you can only select from the configured options)
- Save your profile

### For Editors/Managers
- When adding a reviewer to a submission, use the "Reviewing Interests" filter
- Select the interests you want to filter by
- The reviewer list will update to show only reviewers with those interests
- You can combine this filter with other filters for more specific results

## License

This plugin is licensed under the GNU General Public License v3.0

_Copyright (c) 2025 Lepidus Tecnologia_

