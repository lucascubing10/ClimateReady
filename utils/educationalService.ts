// utils/educationalService.ts
// Hardcoded educational content and learning plans (no Gemini/API usage)

export interface EducationalContent {
    id: string;
    title: string;
    description: string;
    type: 'infographic' | 'video' | 'guide' | 'simulation';
    category: 'water' | 'food' | 'safety' | 'health' | 'shelter' | 'general';
    duration: number; // minutes
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    points: number;
    completed: boolean;
    content: string; // URL or markdown text content
    resources: string[];
    tags: string[];
}

export interface LearningPlan {
    id: string;
    name: string;
    description: string;
    // Optional explicit list of topic IDs; if provided, it takes precedence over filter
    topicIds?: string[];
    // Optional filter to select topics from the hardcoded list
    filter?: (item: EducationalContent) => boolean;
}

// ---------------- Hardcoded Educational Content ----------------
const hardcodedEducationalContent: EducationalContent[] = [
    {
        id: "emergency-water-purification",
        title: "Emergency Water Purification Guide",
        description: "Learn simple methods to make contaminated water safe to drink during a crisis.",
        type: 'guide',
        category: 'water',
        duration: 8,
        difficulty: 'beginner',
        points: 15,
        completed: false,
        content: `## Emergency Water Purification Methods\n\nWhen clean drinking water isn't available during an emergency, you need to know how to purify it safely. Here are the most effective methods:\n\n### Boiling Water\n- Bring water to a **rolling boil** for at least 1 minute (3 minutes at altitudes above 6,500 feet)\n- Let water cool before drinking\n- This kills bacteria, viruses, and parasites\n- Most reliable method when fuel is available\n\n### Chemical Treatment\n- Use **unscented household bleach** (5.25-6% sodium hypochlorite)\n- Add 8 drops per gallon of water (2 drops per liter)\n- Mix well and wait 30 minutes before drinking\n- Water should have a slight chlorine smell\n\n### Water Filters\n- Use portable water filters designed for emergency use\n- Look for filters that remove bacteria and protozoa\n- Follow manufacturer instructions carefully\n- Combine with chemical treatment for viruses\n\n### Solar Disinfection (SODIS)\n- Fill clear plastic bottles with water\n- Place in direct sunlight for 6 hours (or 2 cloudy days)\n- This method uses UV radiation to kill microorganisms\n- Works best in sunny climates`,
        resources: [
            "https://www.ready.gov/water",
            "https://www.cdc.gov/healthywater/emergency/drinking/making-water-safe.html",
            "https://www.redcross.org/get-help/how-to-prepare-for-emergencies/types-of-emergencies/water-safety"
        ],
        tags: ['water', 'purification', 'emergency', 'survival', 'health']
    },
    {
        id: "building-3-day-emergency-food-supply",
        title: "3-Day Emergency Food Supply Guide",
        description: "Learn how to assemble a balanced 3-day emergency food supply for your household.",
        type: 'guide',
        category: 'food',
        duration: 10,
        difficulty: 'beginner',
        points: 15,
        completed: false,
        content: `## Building Your 3-Day Emergency Food Supply\n\nA well-planned emergency food supply can sustain your family during disasters when stores are closed or unreachable.\n\n### Non-Perishable Food Selection\n**Protein Sources:**\n- Canned meats (chicken, tuna, salmon)\n- Peanut butter and nuts\n- Protein bars and beef jerky\n- Canned beans and lentils\n\n**Carbohydrates:**\n- Crackers and dry cereals\n- Instant oatmeal and granola\n- Rice and pasta (if cooking available)\n- Energy bars\n\n**Fruits and Vegetables:**\n- Canned fruits in juice\n- Canned vegetables (low sodium)\n- Dried fruits and nuts\n- Applesauce cups\n\n### Storage Guidelines\n- Store in **cool, dry place** away from direct sunlight\n- Rotate food every 6 months using "first in, first out"\n- Include a **manual can opener**\n- Consider special dietary needs and allergies\n- Keep foods in airtight containers to prevent pests\n\n### Water Requirements\n- Store at least **1 gallon per person per day**\n- Include 3-day supply minimum (3 gallons per person)\n- Don't forget water for pets\n- Store in food-grade containers\n\n### Quick Preparation Tips\n- Choose foods that require no refrigeration or cooking\n- Include comfort foods to boost morale\n- Pack utensils, plates, and cups\n- Consider baby food if you have infants`,
        resources: [
            "https://www.ready.gov/food",
            "https://www.redcross.org/get-help/how-to-prepare-for-emergencies/survival-kit-supplies",
            "https://www.fema.gov/emergency-supply-kit"
        ],
        tags: ['food', 'emergency', 'supplies', 'preparation', 'storage']
    },
    {
        id: "basic-first-aid-common-injuries",
        title: "Basic First Aid for Common Injuries",
        description: "Essential first aid techniques for treating common injuries during emergencies.",
        type: 'guide',
        category: 'health',
        duration: 12,
        difficulty: 'intermediate',
        points: 20,
        completed: false,
        content: `## Basic First Aid for Common Injuries\n\nKnowing basic first aid can save lives during emergencies when professional medical help is delayed.\n\n### Cuts and Wounds\n**For Minor Cuts:**\n1. **Clean your hands** with soap or hand sanitizer\n2. **Stop the bleeding** by applying direct pressure with a clean cloth\n3. **Clean the wound** gently with water\n4. **Apply antibiotic ointment** if available\n5. **Cover with a bandage** and change daily\n\n**For Severe Wounds:**\n- Apply **direct pressure** with a clean cloth\n- **Elevate** the injured area above the heart if possible\n- Do **NOT** remove embedded objects\n- Call for emergency help immediately\n\n### Burns\n**For Minor Burns:**\n1. **Cool immediately** with cool (not cold) water for 10-20 minutes\n2. **Remove jewelry** before swelling occurs\n3. **Cover loosely** with sterile gauze\n4. **Take pain relievers** like ibuprofen if needed\n\n**Never use ice, butter, or oil on burns**\n\n### Sprains and Strains\n**Remember R.I.C.E.:**\n- **Rest** the injured area\n- **Ice** for 15-20 minutes every 2-3 hours for first 48 hours\n- **Compression** with elastic bandage (not too tight)\n- **Elevation** above heart level when possible\n\n### Choking (Heimlich Maneuver)\n**For Adults:**\n1. Stand behind the person\n2. Place fist above navel, below ribcage\n3. Grasp fist with other hand\n4. Push hard and upward\n5. Repeat until object is expelled\n\n### When to Seek Emergency Help\n- Severe bleeding that won't stop\n- Signs of infection (fever, red streaks, pus)\n- Severe burns or burns on face/hands\n- Suspected broken bones\n- Difficulty breathing\n- Loss of consciousness`,
        resources: [
            "https://www.redcross.org/take-a-class/first-aid",
            "https://www.mayoclinic.org/first-aid",
            "https://www.ready.gov/first-aid-kit"
        ],
        tags: ['first-aid', 'health', 'injuries', 'emergency', 'medical']
    },
    {
        id: "creating-home-fire-escape-plan",
        title: "Creating a Home Fire Escape Plan",
        description: "Step-by-step guide to developing and practicing a fire escape plan for your family.",
        type: 'guide',
        category: 'safety',
        duration: 15,
        difficulty: 'beginner',
        points: 18,
        completed: false,
        content: `## Creating a Home Fire Escape Plan\n\nA well-planned fire escape route can save precious seconds and lives during a house fire emergency.\n\n### Step 1: Draw Your Home Layout\n- **Sketch each floor** of your home\n- **Mark all doors and windows** that could be escape routes\n- **Identify two ways out** of every room\n- **Note locations** of smoke alarms and fire extinguishers\n\n### Step 2: Plan Your Escape Routes\n**Primary Routes:**\n- Use **main exits** like front and back doors\n- Ensure paths are **clear of obstacles**\n- Consider mobility needs of all family members\n\n**Secondary Routes:**\n- **Windows** on ground floor or with escape ladders\n- **Alternative doors** (basement, patio)\n- Plan for upper floors with **fire escape ladders**\n\n### Step 3: Choose Meeting Places\n**Outdoor Meeting Spot:**\n- Select a **safe distance** from your home\n- Choose somewhere **everyone knows** (mailbox, neighbor's driveway)\n- Ensure it's **visible to firefighters**\n- Have a **backup location** in case primary is blocked\n\n### Step 4: Special Considerations\n**For Children:**\n- Teach them **not to hide** during fires\n- Practice **low crawling** under smoke\n- Show them how to **test door handles** for heat\n- Assign older children to help younger ones\n\n**For People with Disabilities:**\n- Create **personalized escape plans**\n- Consider **specialized equipment** needs\n- Identify people who can **provide assistance**\n- Practice transfers and evacuation methods\n\n### Step 5: Fire Safety Rules\n- **Test doors** before opening (use back of hand)\n- **Stay low** to avoid smoke and toxic gases\n- **Never go back inside** for belongings\n- **Call 911** only after you're safely outside\n- If trapped, **signal for help** from windows\n\n### Practice Your Plan\n- **Practice twice a year** minimum\n- **Time your escapes** - should be under 2 minutes\n- Practice during **different conditions** (day/night)\n- **Review and update** plan when home layout changes\n\n### Important Equipment\n- **Smoke alarms** on every level and in bedrooms\n- **Fire extinguishers** in kitchen and garage\n- **Emergency ladder** for upper floors\n- **Flashlights** and **whistles** for signaling`,
        resources: [
            "https://www.nfpa.org/Public-Education/Fire-causes-and-risks/Wildfire/Preparing-homes-for-wildfire",
            "https://www.ready.gov/fires",
            "https://www.redcross.org/get-help/how-to-prepare-for-emergencies/types-of-emergencies/fire"
        ],
        tags: ['fire', 'safety', 'escape-plan', 'home', 'family']
    },
    {
        id: "family-emergency-communication-plan",
        title: "Family Emergency Communication Plan",
        description: "Create a comprehensive communication strategy to stay connected during disasters.",
        type: 'guide',
        category: 'general',
        duration: 12,
        difficulty: 'intermediate',
        points: 16,
        completed: false,
        content: `## Family Emergency Communication Plan\n\nDuring disasters, communication systems may be disrupted. Having a plan helps family members connect and reunite.\n\n### Contact Information List\n**Essential Contacts:**\n- **Primary emergency contact** (local)\n- **Out-of-state contact** (disasters often affect local areas only)\n- **Workplace contacts** for all family members\n- **School contacts** for children\n- **Medical providers** and pharmacy\n- **Insurance companies**\n- **Utility companies**\n\n### Meeting Places\n**Local Meeting Place:**\n- Choose a location **near your home**\n- Should be easily accessible to all family members\n- Examples: library, community center, religious building\n\n**Regional Meeting Place:**\n- Select a location **outside your neighborhood**\n- In case local area is evacuated\n- Should be familiar to all family members\n\n### Communication Methods\n**Text Messages:**\n- Often work when **phone calls don't**\n- Use **brief, clear messages**\n- Include location and status\n\n**Social Media:**\n- **Facebook Safety Check** and similar features\n- **Group messages** on messaging apps\n- **Location sharing** when possible\n\n**Alternative Methods:**\n- **Two-way radios** for local communication\n- **Ham radios** for emergency operators\n- **Emergency broadcast** systems\n\n### Important Documents\n**Keep Copies in:**\n- **Waterproof container** at home\n- **Safe deposit box** or with trusted friend\n- **Digital copies** in secure cloud storage\n\n**Documents to Include:**\n- Insurance policies and agent info\n- Medical records and prescriptions\n- Bank account and credit card info\n- Important family photos\n- Identification documents\n\n### Communication Card Template\nCreate wallet-sized cards with:\n- **Family contact information**\n- **Meeting place addresses**\n- **Out-of-area contact details**\n- **Medical information** and allergies\n- **Insurance policy numbers**\n\n### Special Considerations\n**For Children:**\n- Teach them to **memorize important phone numbers**\n- Explain when and how to **call 911**\n- Practice using **different types of phones**\n- Create **child-friendly contact cards**\n\n**For Elderly or Disabled Family Members:**\n- Include **medical equipment** information\n- List **medication requirements**\n- Identify **special assistance** needs\n- Plan for **service animal** care\n\n### Testing Your Plan\n- **Practice quarterly** with all family members\n- **Test different communication methods**\n- **Update contact information** regularly\n- **Review meeting places** for accessibility\n- **Adjust plan** based on family changes`,
        resources: [
            "https://www.ready.gov/make-a-plan",
            "https://www.redcross.org/get-help/how-to-prepare-for-emergencies/make-a-plan",
            "https://www.fema.gov/emergency-planning"
        ],
        tags: ['communication', 'planning', 'family', 'emergency', 'contacts']
    },
    {
        id: "assembling-go-bag",
        title: "Assembling Your Go-Bag",
        description: "Essential items to pack in a portable emergency kit for quick evacuation.",
        type: 'guide',
        category: 'general',
        duration: 14,
        difficulty: 'beginner',
        points: 17,
        completed: false,
        content: `## Assembling Your Go-Bag (Evacuation Kit)\n\nA go-bag is a portable kit with essential items you can grab quickly if you need to evacuate immediately.\n\n### Basic Supplies (72-Hour Kit)\n**Water and Food:**\n- **1 gallon of water** per person per day (3-day supply)\n- **Water purification tablets** or portable filter\n- **Non-perishable food** for 3 days per person\n- **Manual can opener** and eating utensils\n\n**Clothing and Bedding:**\n- **Change of clothes** for each person\n- **Sturdy shoes** and socks\n- **Blanket or sleeping bag** per person\n- **Rain gear** and warm clothing\n\n### Important Documents\n**Keep in Waterproof Container:**\n- **Copies of ID** (driver's license, passport)\n- **Insurance policies** (home, car, health)\n- **Medical records** and prescription info\n- **Bank account** and credit card information\n- **Emergency contact list**\n- **Cash and credit cards**\n- **Important family photos**\n\n### Tools and Supplies\n**Essential Tools:**\n- **Battery-powered or hand-crank radio**\n- **Flashlight** with extra batteries\n- **First aid kit** and medications\n- **Whistle** for signaling help\n- **Plastic sheeting** and duct tape\n- **Moist towelettes** and garbage bags\n- **Wrench or pliers** to turn off utilities\n\n### Personal Items\n**Health and Hygiene:**\n- **Prescription medications** (7-day supply)\n- **Eyeglasses** and contact lenses\n- **Personal hygiene items**\n- **Feminine supplies**\n- **Diapers** (if needed)\n\n**Communication:**\n- **Cell phone** with chargers\n- **Portable battery bank**\n- **Two-way radios**\n- **Emergency contact information**\n\n### Special Considerations\n**For Babies and Young Children:**\n- **Formula and baby food**\n- **Diapers and wipes**\n- **Comfort items** (teddy bear, blanket)\n- **Games and activities**\n\n**For Elderly Family Members:**\n- **Extra medications**\n- **Medical equipment** (hearing aids, glasses)\n- **Comfort items**\n- **List of medical conditions**\n\n**For Pets:**\n- **Pet carriers** and leashes\n- **Pet food** and water bowls\n- **Medications** and medical records\n- **Waste bags** and litter\n- **Recent photos** of pets\n\n### Storage and Maintenance\n**Storage Tips:**\n- Use **sturdy, portable containers**\n- **Label everything** clearly\n- Store in **easily accessible location**\n- Keep **one kit per vehicle** and workplace\n\n**Maintenance Schedule:**\n- **Review contents** every 6 months\n- **Replace expired items** (food, medications, batteries)\n- **Update documents** and contact information\n- **Rotate clothing** for seasonal changes\n- **Test equipment** regularly\n\n### Quick Grab Items\nKeep these items easily accessible:\n- **Keys** and important documents\n- **Medications**\n- **Cell phone** and charger\n- **Cash**\n- **Emergency contact list**\n\n### Evacuation Checklist\nWhen evacuation is ordered:\n1. **Grab your go-bag**\n2. **Secure your home** (lock doors, shut off utilities if time permits)\n3. **Take evacuation routes** recommended by authorities\n4. **Let family know** your location\n5. **Listen to emergency broadcasts** for updates`,
        resources: [
            "https://www.ready.gov/kit",
            "https://www.redcross.org/get-help/how-to-prepare-for-emergencies/survival-kit-supplies",
            "https://www.fema.gov/emergency-supply-kit"
        ],
        tags: ['go-bag', 'evacuation', 'emergency-kit', 'supplies', 'preparedness']
    },
    {
        id: "understanding-weather-alerts",
        title: "Understanding Weather Alerts",
        description: "Learn to interpret weather warnings and alerts to take appropriate action.",
        type: 'guide',
        category: 'safety',
        duration: 10,
        difficulty: 'beginner',
        points: 14,
        completed: false,
        content: `## Understanding Weather Alerts\n\nWeather alerts provide crucial information about dangerous conditions. Knowing what they mean can save lives.\n\n### Alert Levels and Meanings\n\n**WATCH:**\n- **Conditions are favorable** for severe weather to develop\n- **Be prepared** to take action\n- **Stay informed** and monitor updates\n- Example: "Tornado Watch until 8 PM"\n\n**WARNING:**\n- **Severe weather is imminent or occurring**\n- **Take immediate action** to protect life and property\n- **Seek shelter** or follow evacuation orders\n- Example: "Tornado Warning until 6:30 PM"\n\n**ADVISORY:**\n- **Weather conditions may cause inconvenience**\n- **Exercise caution** but immediate danger is low\n- Example: "Winter Weather Advisory"\n\n### Common Weather Alerts\n\n**Tornado Alerts:**\n- **Tornado Watch:** Conditions favor tornado development\n- **Tornado Warning:** Tornado spotted or indicated on radar\n- **Action:** Go to lowest floor, interior room, away from windows\n\n**Severe Thunderstorm:**\n- **Watch:** Conditions favor severe storms\n- **Warning:** Severe storm approaching with damaging winds/hail\n- **Action:** Stay indoors, avoid windows, unplug electronics\n\n**Flood Alerts:**\n- **Flood Watch:** Heavy rain may cause flooding\n- **Flood Warning:** Flooding is imminent or occurring\n- **Flash Flood Warning:** Life-threatening flooding in small areas\n- **Action:** Avoid driving through flooded roads, seek higher ground\n\n**Hurricane/Tropical Storm:**\n- **Tropical Storm Watch/Warning:** Winds 39-73 mph expected\n- **Hurricane Watch/Warning:** Winds 74+ mph expected\n- **Action:** Follow evacuation orders, secure property\n\n**Winter Weather:**\n- **Winter Storm Watch:** Significant snow/ice possible\n- **Winter Storm Warning:** Heavy snow/ice imminent\n- **Blizzard Warning:** Heavy snow with strong winds\n- **Action:** Avoid travel, stock emergency supplies\n\n### Where to Get Alerts\n\n**Official Sources:**\n- **National Weather Service** (weather.gov)\n- **Emergency Alert System** (TV/Radio)\n- **Wireless Emergency Alerts** (cell phones)\n- **NOAA Weather Radio**\n\n**Mobile Apps:**\n- **Weather apps** with alert notifications\n- **Local emergency management** apps\n- **Red Cross Emergency** app\n- **FEMA** app\n\n### Alert Information to Note\n\n**Key Details:**\n- **What:** Type of hazard\n- **Where:** Specific areas affected\n- **When:** Start and end times\n- **Severity:** Expected impacts\n- **Action:** What you should do\n\n**Geographic Terms:**\n- **Counties** and **parishes**\n- **Cities** and **towns**\n- **Zones** (coastal, inland, mountain)\n- **Watersheds** for flood alerts\n\n### Taking Action\n\n**Immediate Actions:**\n1. **Stop what you're doing** and pay attention\n2. **Assess your location** and safety\n3. **Follow recommended actions** immediately\n4. **Monitor updates** continuously\n5. **Help others** who may not have received alerts\n\n**Communication:**\n- **Share information** with family and neighbors\n- **Check on vulnerable** community members\n- **Follow official sources** only\n- **Avoid spreading rumors** or unverified information\n\n### Common Mistakes to Avoid\n\n- **Ignoring watches** thinking they're not serious\n- **Waiting too long** to take action during warnings\n- **Relying on single source** for weather information\n- **Assuming alerts don't apply** to your exact location\n- **Going outside** to "see" the severe weather\n\n### Special Considerations\n\n**For People with Disabilities:**\n- **Accessible alert systems** (visual, vibrating)\n- **Caregiver notification** systems\n- **Specialized evacuation** plans\n\n**For Rural Areas:**\n- **Multiple alert methods** due to limited cell service\n- **Community notification** systems\n- **Weather spotters** and amateur radio`,
        resources: [
            "https://www.weather.gov/safety/",
            "https://www.ready.gov/alerts",
            "https://www.weather.gov/wrn/wea"
        ],
        tags: ['weather', 'alerts', 'warnings', 'safety', 'emergency']
    },
    {
        id: "basic-shelter-in-place-techniques",
        title: "Basic Shelter-in-Place Techniques",
        description: "Learn when and how to shelter safely in your current location during emergencies.",
        type: 'guide',
        category: 'shelter',
        duration: 11,
        difficulty: 'intermediate',
        points: 15,
        completed: false,
        content: `## Basic Shelter-in-Place Techniques\n\nSometimes it's safer to stay where you are rather than evacuate. Learn when and how to shelter-in-place effectively.\n\n### When to Shelter-in-Place\n\n**Chemical/Biological Hazards:**\n- **Chemical spills** or gas leaks\n- **Industrial accidents** with airborne toxins\n- **Biological contamination**\n- **Radioactive material** releases\n\n**Severe Weather:**\n- **Tornadoes** (if in sturdy building)\n- **Severe thunderstorms** with large hail\n- **Blizzards** with whiteout conditions\n- **Extreme heat** events\n\n**Security Threats:**\n- **Active shooter** situations\n- **Civil unrest** in your area\n- **Terrorist incidents**\n\n### Selecting Your Shelter Room\n\n**Best Room Characteristics:**\n- **Above ground level** (avoid basements for chemical hazards)\n- **Fewest windows and doors**\n- **Smallest room** possible for your group\n- **Access to water and bathroom** if possible\n- **Good cell phone reception**\n\n**Avoid These Areas:**\n- **Rooms with ventilation systems**\n- **Areas near chemical storage**\n- **Rooms with many windows**\n- **Garages** (car exhaust concerns)\n\n### Sealing Your Shelter\n\n**Materials Needed:**\n- **Plastic sheeting** (4 mil thickness minimum)\n- **Duct tape**\n- **Scissors or knife**\n- **Towels or blankets**\n\n**Sealing Process:**\n1. **Turn off** all ventilation systems (HVAC, fans)\n2. **Close and lock** all windows and doors\n3. **Seal gaps** around doors with tape and plastic\n4. **Cover vents** with plastic and tape\n5. **Seal electrical outlets** and light switches\n6. **Block gaps** under doors with towels\n\n### Essential Supplies for Sheltering\n\n**Basic Needs:**\n- **Water:** 1 gallon per person per day\n- **Food:** Non-perishable items for 2-3 days\n- **Medications:** All prescription medications\n- **Radio:** Battery-powered or hand-crank\n- **Flashlights** and extra batteries\n- **First aid kit**\n\n**Comfort Items:**\n- **Blankets and pillows**\n- **Books, games, activities**\n- **Portable phone chargers**\n- **Comfort items** for children\n\n### Communication During Sheltering\n\n**Stay Informed:**\n- **Listen to emergency broadcasts**\n- **Monitor official social media**\n- **Check emergency alert systems**\n- **Follow local emergency management**\n\n**Contact Others:**\n- **Text instead of calling** (uses less bandwidth)\n- **Update social media status** once\n- **Conserve phone battery**\n- **Designate one person** to communicate for group\n\n### Health and Safety Considerations\n\n**Air Quality:**\n- **Monitor for unusual odors**\n- **Watch for symptoms** (headache, dizziness, nausea)\n- **Don't use candles** or gas appliances\n- **Minimize physical activity**\n\n**Psychological Well-being:**\n- **Stay calm** and reassure others\n- **Maintain routines** when possible\n- **Keep children occupied** with activities\n- **Take breaks** from news if it increases anxiety\n\n### Different Shelter Scenarios\n\n**Tornado Shelter:**\n- **Lowest floor** of building\n- **Interior room** away from windows\n- **Under sturdy furniture** if possible\n- **Protect head and neck** with arms\n- **Stay until all clear** is given\n\n**Chemical Hazard Shelter:**\n- **Seal room completely**\n- **Upper floors** may be safer\n- **Turn off all air systems**\n- **Monitor emergency broadcasts**\n- **Wait for official all-clear**\n\n**Active Threat Shelter:**\n- **Lock and barricade doors**\n- **Turn off lights**\n- **Stay quiet** and out of sight\n- **Silence phones**\n- **Wait for law enforcement** all-clear\n\n### When to Leave Your Shelter\n\n**Official All-Clear:**\n- **Wait for official announcement**\n- **Verify through multiple sources**\n- **Follow evacuation instructions** if given\n- **Don't leave early** unless life-threatening emergency\n\n**Emergency Situations:**\n- **Fire in building**\n- **Structural damage**\n- **Medical emergency**\n- **Rising water** (flood)\n\n### After Sheltering\n\n**Leaving Safely:**\n- **Check for hazards** before opening doors\n- **Test air quality** gradually\n- **Report damage** or issues to authorities\n- **Help neighbors** who may need assistance\n\n**Recovery Steps:**\n- **Ventilate your space** once safe\n- **Check for contamination**\n- **Clean and disinfect** if needed\n- **Restock supplies** for future emergencies`,
        resources: [
            "https://www.ready.gov/shelter",
            "https://www.cdc.gov/disasters/earthquakes/during.html",
            "https://www.fema.gov/emergency-managers/practitioners/continuity-guidance/shelter-place"
        ],
        tags: ['shelter', 'safety', 'emergency', 'indoor', 'protection']
    }
];

// ---------------- Fetchers (Hardcoded) ----------------
export const fetchEducationalContent = async (topic: string): Promise<EducationalContent> => {
    const topicId = topic.toLowerCase().replace(/\s+/g, '-');
    const content = hardcodedEducationalContent.find((item) => item.id === topicId);
    if (content) return { ...content };

    // Generic fallback if topic ID not found
    return {
        id: topicId,
        title: topic,
        description: `Learn essential information about ${topic} for emergency preparedness.`,
        type: 'guide',
        category: 'general',
        duration: 5,
        difficulty: 'beginner',
        points: 10,
        completed: false,
        content: `This guide covers important information about ${topic}. Please check reliable emergency preparedness resources for comprehensive information on this topic.`,
        resources: [
            'https://www.ready.gov',
            'https://www.redcross.org/get-help/how-to-prepare-for-emergencies.html',
        ],
        tags: ['emergency', 'preparedness', 'safety'],
    };
};

export const fetchAllEducationalContent = async (): Promise<EducationalContent[]> => {
    return hardcodedEducationalContent.map((item) => ({ ...item }));
};

// ---------------- Learning Plans ----------------
export const learningPlans: LearningPlan[] = [
    {
        id: 'beginner-essentials',
        name: 'Beginner Essentials',
        description: 'Core topics to get started with emergency preparedness in under 45 minutes.',
        filter: (item: EducationalContent) => item.difficulty === 'beginner',
    },
    {
        id: 'family-safety',
        name: 'Family Safety Plan',
        description: 'Communication, fire safety, and go-bag prep for households with kids or seniors.',
        topicIds: [
            'family-emergency-communication-plan',
            'creating-home-fire-escape-plan',
            'assembling-go-bag',
        ],
    },
    {
        id: 'storm-ready',
        name: 'Storm Ready',
        description: 'Focus on weather alerts, sheltering, and supplies for storms and power outages.',
        topicIds: [
            'understanding-weather-alerts',
            'basic-shelter-in-place-techniques',
            'building-3-day-emergency-food-supply',
        ],
    },
];

export const getLearningPlans = async (): Promise<LearningPlan[]> => {
    return learningPlans.map((p) => ({ ...p }));
};

export const fetchLearningPlan = async (planId: string): Promise<EducationalContent[]> => {
    const plan = learningPlans.find((p) => p.id === planId);
    if (!plan) return fetchAllEducationalContent();

    let selected: EducationalContent[] = [];
    if (plan.topicIds && plan.topicIds.length > 0) {
        selected = hardcodedEducationalContent.filter((item) => plan.topicIds!.includes(item.id));
    } else if (plan.filter) {
        selected = hardcodedEducationalContent.filter((item) => plan.filter!(item));
    } else {
        selected = hardcodedEducationalContent;
    }

    return selected.map((item) => ({ ...item }));
};
