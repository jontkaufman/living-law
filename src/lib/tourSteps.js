// src/lib/tourSteps.js
export const tourSteps = [
  {
    target: 'body',
    placement: 'center',
    disableBeacon: true,
    title: 'Welcome to the Torah Laws',
    content: `Explore the laws in the Torah and how they relate to us today.

These laws are organized under the two greatest commands — Love YHWH and Love Your Neighbor. The 10 commandments fall under these two, and all other laws are categorized accordingly.

Browse categories, read original verses, and discover the structure behind biblical law.`,
    locale: { skip: 'Skip Tour', next: 'Next' },
  },
  {
    target: '[data-tour="list-categories"]',
    placement: 'right',
    disableBeacon: true,
    title: 'Browse the List',
    content: `You're viewing the list of laws organized by categories. Click the arrows to expand categories and see the laws within.

Click any law to view its full text and details in the side panel.`,
  },
  {
    target: '[data-tour="side-panel"]',
    placement: 'left',
    disableBeacon: true,
    title: 'Law Details',
    content: `When you click a law, the side panel opens here.

You'll see the full text, scripture references, and related information.`,
  },
  {
    target: '[data-tour="panel-references"]',
    placement: 'left',
    disableBeacon: true,
    title: 'Reading References',
    content: `Click any reference (like "Exodus 20:8-11") to read the original verse.

The verse will appear in context so you can understand it fully.`,
  },
  {
    target: '[data-tour="view-switchers"]',
    placement: 'bottom-end',
    disableBeacon: true,
    title: 'Switch Views',
    content: `Try different views to explore the laws:

• List - Browse by categories (current view)
• Network - Visual map of connections
• Split - Both views side-by-side
• Dashboard - Statistics and insights`,
    locale: { last: 'Done' },
  },
]
