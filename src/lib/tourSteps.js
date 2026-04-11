// src/lib/tourSteps.js
export const tourSteps = [
  {
    target: 'body',
    placement: 'center',
    disableBeacon: true,
    title: 'Welcome to the Torah Laws',
    content: `Explore the laws in the Torah and how they relate to us today.
You'll find these organized under the two greatest commands -
Love YHWH and Love Your Neighbor - the 10 commandments all fall
under these two and the rest of the laws are categorized under
those. This interactive map reveals how they all connect and
allows you to navigate and explore God's ways. Navigate categories,
read original verses, and discover the structure behind biblical law.`,
    locale: { skip: 'Skip Tour', next: 'Next' },
  },
  {
    target: '[data-tour="network-canvas"]',
    placement: 'center',
    disableBeacon: true,
    title: 'Navigate the Network',
    content: `Click on any glowing node to explore that category. The network
expands to show subcategories and individual laws.

Click a law (the small circles) to view its details.`,
  },
  {
    target: '[data-tour="side-panel"]',
    placement: 'left',
    disableBeacon: true,
    title: 'Open Side Panel',
    content: `When you click a law, the side panel opens with the full text,
references, and related information.`,
  },
  {
    target: '[data-tour="panel-references"]',
    placement: 'left',
    disableBeacon: true,
    title: 'Using the Side Panel',
    content: `Click any reference (like "Exodus 20:8-11") to read the original
verse in context.`,
  },
  {
    target: '[data-tour="view-switchers"]',
    placement: 'bottom',
    disableBeacon: true,
    title: 'View Switchers',
    content: `Switch between different views:
• Network - Visual map of connections
• List - Browse by categories
• Split - Both views side-by-side
• Dashboard - Statistics and insights`,
    locale: { last: 'Done' },
  },
]
