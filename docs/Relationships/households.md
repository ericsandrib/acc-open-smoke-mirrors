# Households & Organizations

The platform models complex client structures — families, dependents, related contacts, and linked businesses. A single relationship record can contain multiple household members, connected individuals, and associated organizations. This structure allows advisors to see the full picture of a client's personal and business relationships in one place.

---

## Feature overview

### Household tab

The Household tab on a relationship profile organizes people and entities into three groups:

- **Household members** — direct members of the household (e.g., the client, spouse, dependents). Primary members are flagged and displayed first.
- **Related contacts** — individuals connected to the household through other relationships (e.g., a parent, attorney, or accountant).
- **Related organizations** — businesses or entities linked to the household (e.g., a family trust, employer, or business entity). Clicking a related organization navigates to that organization's own relationship profile.

A left sidebar lists all members and contacts with name, role, age, and a primary-member indicator. Selecting a person opens their full detail panel on the right.

### Household member detail

When a household member is selected, the platform displays:

- **Basic information** — status, preferred name, date of birth, age, and identification number (with copy-to-clipboard support).
- **Contact information** — preferred phone and email, with type labels (e.g., "Mobile," "Work Email").
- **Addresses** — up to four addresses (mailing, billing, shipping, other) with a preferred-address indicator.
- **Client portal status** — whether the member is registered for the client portal and their last login date.

### Household in the sidebar

Household members also appear in the relationship detail sidebar (Details panel), showing each member's name, role, and primary-member status. This provides quick context without switching to the Household tab.

### Household in the Passport card

The Passport quick-view card includes a Household tab listing all members with:

- Name, role, preferred name
- Date of birth and age
- Identification number
- Phone, email
- Up to four addresses with preferred-address indicator

### Actions from the Household tab

- **Edit in CRM** — opens the corresponding account record in the CRM for editing.
- **Add contact** — opens the CRM to add a new contact to the household.
- **Launch client portal** — generates an authenticated session and opens the client portal for the selected household member.
- **View details** — opens an extended information drawer.

---

## Data points

### Household member (basic information)

| Data Point | Description | Example | Source |
|-----------|-------------|---------|--------|
| First Name | Member's first name | John | Synced from CRM |
| Last Name | Member's last name | Whitfield | Synced from CRM |
| Display Name | Full display name | John Whitfield | Synced from CRM |
| Preferred Name | Nickname or preferred name | Jack | Synced from CRM |
| Role | Role within the household | Client, Spouse, Dependent, Trustee | Synced from CRM |
| Is Primary | Whether this is the primary household member | Yes | Synced from CRM |
| Status | Contact status or role classification (may contain multiple values) | Client, Active | Synced from CRM |
| Date of Birth | Member's date of birth | Jun 15, 1978 | Synced from CRM |
| Age | Member's current age | 47 | Auto-calculated |
| Identification Number | Social Security Number or Tax ID | ***-**-6789 | Synced from CRM |
| Segmentation | Service offering or segment classification | Wealth & Tax | Synced from CRM |

### Household member (contact information)

| Data Point | Description | Example | Source |
|-----------|-------------|---------|--------|
| Preferred Phone | Primary phone number | (617) 555-0142 | Synced from CRM |
| Phone Type | Type of preferred phone | Mobile | Synced from CRM |
| Home Phone | Home phone number | (617) 555-0100 | Synced from CRM |
| Work Phone | Work phone number | (617) 555-0200 | Synced from CRM |
| Other Phone | Additional phone number | (617) 555-0300 | Synced from CRM |
| Preferred Email | Primary email address | john.whitfield@example.com | Synced from CRM |
| Email Type | Type of preferred email | Personal | Synced from CRM |
| Work Email | Work email address | jwhitfield@company.com | Synced from CRM |
| Other Email | Additional email address | john.w@other.com | Synced from CRM |

### Household member (addresses)

| Data Point | Description | Example | Source |
|-----------|-------------|---------|--------|
| Mailing Address | Mailing address (street, city, state, ZIP, country) | 123 Oak Street, Boston, MA 02101 | Synced from CRM |
| Billing Address | Billing address | 123 Oak Street, Boston, MA 02101 | Synced from CRM |
| Shipping Address | Shipping address | 456 Elm Avenue, Newton, MA 02458 | Synced from CRM |
| Other Address | Additional address | 789 Lake Road, Falmouth, MA 02540 | Synced from CRM |
| Preferred Address | Which address is marked as preferred | Mailing | Synced from CRM |

### Household member (client portal)

| Data Point | Description | Example | Source |
|-----------|-------------|---------|--------|
| Registered for Client Portal | Whether the member has a client portal account | Yes | Synced from CRM |
| Last Login | Date of most recent client portal login | Mar 20, 2026 | Synced from CRM |

### Related contacts

| Data Point | Description | Example | Source |
|-----------|-------------|---------|--------|
| Name | Contact's full name | Margaret Whitfield | Synced from CRM |
| Role | Relationship to the household | Parent | Synced from CRM |
| Relationship Category | Category of the connection | Family, Professional, Other | Synced from CRM |
| Date of Birth | Contact's date of birth | Apr 22, 1950 | Synced from CRM |
| Age | Contact's current age | 75 | Auto-calculated |

### Related organizations

| Data Point | Description | Example | Source |
|-----------|-------------|---------|--------|
| Organization Name | Name of the linked entity | Whitfield & Associates LLC | Synced from CRM |
| Role | Organization's relationship to the household | Employer, Trust, Business Entity | Synced from CRM |
| Relationship Category | Category of the organizational connection | Business, Legal, Other | Synced from CRM |

---

## Customization options

| Setting | What It Controls | Options | Default | Who Configures |
|---------|-----------------|---------|---------|----------------|
| Household member display order | How members are sorted in the sidebar and Passport card | Primary members first, then alphabetical | Primary members first | Platform default |
| Primary member designation | Which household member is flagged as the primary contact | Any household member can be designated as primary | Set in CRM | CRM administrator |
| Address types tracked | Which address types are captured per member | Mailing, Billing, Shipping, Other | All four types available | Administrator |
| Preferred address indicator | Which address is marked as the member's preferred address | Any of the tracked address types | None | CRM administrator |
| Client portal access | Whether the "Launch Client Portal" button appears for a member | Available for household members with portal registration | Available if registered | Administrator |
| CRM edit links | Whether "Edit in CRM" and "Add contact" buttons are available | Enabled when CRM integration is active | Enabled | Administrator |
| Contact detail fields | Which phone and email fields are displayed | Preferred, Home, Work, Other (for both phone and email) | All available fields shown | Administrator |
| Role labels | The labels used for household member roles | Configurable in the CRM (e.g., Client, Spouse, Dependent, Trustee, Power of Attorney) | CRM-defined | CRM administrator |
| Related contact visibility | Whether related contacts (non-household connections) are shown | Shown if connected contacts exist in the CRM | Shown | Platform default |
| Related organization visibility | Whether related organizations are displayed | Shown if organizational connections exist in the CRM | Shown | Platform default |

---

## Related

- [Relationship Profiles](./01-relationship-profiles.md) — the full relationship record and how it is structured
- [Investments, Communications & Documents](./03-investments-communications-documents.md) — the supporting data tabs on each relationship profile
- [Embeddable UI & Integration](../07-enterprise/03-embeddable-ui-and-integration.md) — how external systems like CRM integrate with the platform
