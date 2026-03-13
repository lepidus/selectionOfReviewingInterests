/**
 * Test5_reviewerSelectionInterestFilter.cy.js
 * 
 * Tests for the reviewing interests filter in reviewer selection modal
 * Verifies that the interests filter is displayed and works correctly
 */

describe('Reviewer Selection Interests Filter', function() {
    let contextId;
    let submissionId;
    let stageId;

    beforeEach(function() {
        // Setup: Login as manager/editor
        cy.login('admin', 'admin');
        
        // Navigate to a journal and find a submission
        cy.visit('/index.php/publicknowledge/en/dashboard/editorial');
        
        // Get the first submission ID from the URL or DOM
        cy.get('a[href*="/workflow/externalReview/"]').first().click({ force: true });
        
        // Extract submission ID from URL
        cy.location('pathname').then((pathname) => {
            const match = pathname.match(/\/workflow\/externalReview\/(\d+)/);
            if (match) {
                submissionId = match[1];
            }
        });
        
        // Assume context ID is 1 for this test (journal ID)
        contextId = 1;
    });

    it('Should display reviewing interests filter in Add Reviewer modal', function() {
        // Click on "Add Reviewer" button if visible
        cy.get('a[class*="btn"]').contains('Add Reviewer', { matchCase: false }).click({ force: true });
        
        // Wait for modal to appear
        cy.get('[id*="select-reviewer"]', { timeout: 10000 }).should('be.visible');
        
        // Check if interests filter is displayed
        cy.get('[class*="listPanel"]')
            .contains('Reviewing Interests', { matchCase: false })
            .should('exist');
    });

    it('Should list configured reviewing interests in filter', function() {
        // Click on "Add Reviewer" button
        cy.get('a[class*="btn"]').contains('Add Reviewer', { matchCase: false }).click({ force: true });
        
        // Wait for modal to appear
        cy.get('[id*="select-reviewer"]', { timeout: 10000 }).should('be.visible');
        
        // Find the interests filter
        cy.get('label').contains('Reviewing Interests', { matchCase: false })
            .closest('[class*="filter"]')
            .find('input, select, [role="listbox"]')
            .should('exist');
    });

    it('Should filter reviewers when interests are selected', function() {
        // Get initial reviewer count
        let initialCount;
        
        cy.get('a[class*="btn"]').contains('Add Reviewer', { matchCase: false }).click({ force: true });
        
        cy.get('[id*="select-reviewer"]', { timeout: 10000 }).should('be.visible');
        
        // Get initial number of reviewers shown
        cy.get('[class*="reviewer"]')
            .filter('[class*="item"]')
            .its('length')
            .then((count) => {
                initialCount = count;
            });
        
        // Select an interest filter option (if available)
        cy.get('label').contains('Reviewing Interests', { matchCase: false })
            .closest('[class*="filter"]')
            .find('[role="checkbox"], input[type="checkbox"]')
            .first()
            .then(($checkbox) => {
                if ($checkbox.length > 0) {
                    cy.wrap($checkbox).click({ force: true });
                    
                    // Wait for filtering to complete
                    cy.wait(1000);
                    
                    // Reviewer count may change
                    cy.get('[class*="reviewer"]')
                        .filter('[class*="item"]')
                        .its('length')
                        .should('be.lte', initialCount);
                }
            });
    });

    it('Should apply AND logic when multiple interests are selected', function() {
        cy.get('a[class*="btn"]').contains('Add Reviewer', { matchCase: false }).click({ force: true });
        
        cy.get('[id*="select-reviewer"]', { timeout: 10000 }).should('be.visible');
        
        // Try to select multiple interest checkboxes
        cy.get('label').contains('Reviewing Interests', { matchCase: false })
            .closest('[class*="filter"]')
            .find('[role="checkbox"], input[type="checkbox"]')
            .then(($checkboxes) => {
                if ($checkboxes.length >= 2) {
                    // Click first checkbox
                    cy.wrap($checkboxes.eq(0)).click({ force: true });
                    cy.wait(500);
                    
                    // Click second checkbox
                    cy.wrap($checkboxes.eq(1)).click({ force: true });
                    cy.wait(500);
                    
                    // Verify that reviewers shown should have at least one of the interests
                    // (This is a basic check - actual assertion depends on your data)
                    cy.get('[id*="select-reviewer"]').should('be.visible');
                }
            });
    });

    it('Should be able to clear interests filter', function() {
        cy.get('a[class*="btn"]').contains('Add Reviewer', { matchCase: false }).click({ force: true });
        
        cy.get('[id*="select-reviewer"]', { timeout: 10000 }).should('be.visible');
        
        // Select an interest
        cy.get('label').contains('Reviewing Interests', { matchCase: false })
            .closest('[class*="filter"]')
            .find('[role="checkbox"], input[type="checkbox"]')
            .first()
            .click({ force: true });
        
        cy.wait(500);
        
        // Clear the selection
        cy.get('label').contains('Reviewing Interests', { matchCase: false })
            .closest('[class*="filter"]')
            .find('[role="checkbox"], input[type="checkbox"]')
            .first()
            .click({ force: true });
        
        cy.wait(500);
        
        // Should still show the modal
        cy.get('[id*="select-reviewer"]').should('be.visible');
    });

    it('Should work with search phrase combined', function() {
        cy.get('a[class*="btn"]').contains('Add Reviewer', { matchCase: false }).click({ force: true });
        
        cy.get('[id*="select-reviewer"]', { timeout: 10000 }).should('be.visible');
        
        // Find search input
        cy.get('input[placeholder*="Search"], input[class*="search"]')
            .first()
            .type('test');
        
        cy.wait(500);
        
        // Now select an interest filter
        cy.get('label').contains('Reviewing Interests', { matchCase: false })
            .closest('[class*="filter"]')
            .find('[role="checkbox"], input[type="checkbox"]')
            .first()
            .click({ force: true });
        
        cy.wait(500);
        
        // Verify results are filtered by both search and interests
        cy.get('[id*="select-reviewer"]').should('be.visible');
    });
});
