// [Opus 4.8] Benchhoard glossary — replaces the dating-app copy.
/**
 * Single source of truth for every user-facing string. The voice is calm,
 * earnest, and quietly pro-public-space — finding a place to sit is a small act
 * of reclaiming the city. No leftover dating/hiring vocabulary anywhere in
 * user-facing copy (enforced by glossary.test.ts).
 */
export const glossary = {
  brand: {
    name: "Benchhoard",
    shortName: "BH",
    tagline: "Find a place to sit down.",
  },

  auth: {
    signInTitle: "Welcome back",
    signInSub: "Pick up your hoard where you left off.",
    signUpTitle: "Start your hoard",
    signUpSub: "Claim benches and save them across your devices.",
    emailLabel: "Email",
    passwordLabel: "Password",
    signInCta: "Sign in",
    signUpCta: "Create account",
    verifyTitle: "Check your inbox",
    verifySub: "We sent a 6-digit code to confirm it's you.",
    verifyCta: "Confirm",
    toSignUp: "New here? Start a hoard",
    toSignIn: "Already have a hoard? Sign in",
    signOut: "Sign out",
    gateTitle: "Sign in to hoard",
    gateBody: "Browsing is always free. Sign in to claim benches, add new ones, and earn discovery points.",
  },

  tabs: {
    map: "Map",
    compass: "Compass",
    hoard: "Hoard",
    you: "You",
  },

  map: {
    title: "Benches near you",
    locating: "Finding your location…",
    locationDenied: "Location is off. Turn it on to see benches around you.",
    empty: "No benches mapped here yet. Be the first — add one.",
    addCta: "Add a bench",
    recenter: "Recenter",
    radius: (km: number) => `Within ${km} km`,
  },

  compass: {
    title: "Nearest bench",
    sub: "Point the top of your phone where you're walking.",
    calibrating: "Calibrating compass — move your phone in a figure eight.",
    noBench: "No benches nearby to point to. Try widening your search on the map.",
    arrived: "You're here — look up.",
    distance: (meters: number) =>
      meters < 1000 ? `${Math.round(meters)} m away` : `${(meters / 1000).toFixed(1)} km away`,
    headingUnavailable: "Compass unavailable on this device.",
  },

  bench: {
    qualities: "Qualities",
    seatType: "Seat type",
    hostility: "Hostility Index",
    material: "Material",
    sun: "Exposure",
    noise: "Audio",
    sightline: "Sightlines",
    amenities: "Amenities",
    capacity: "Seats",
    photos: "Photos",
    notes: "Field notes",
    addedBy: "Added by a hoarder",
    fromOsm: "From OpenStreetMap",
    unverified: "Unverified — added by a hoarder, not yet confirmed.",
    directions: "Point me there",
    photosEmpty: "No photos yet. Add one next time you're here.",
  },

  seatTypes: {
    true_bench: "True bench",
    picnic_table: "Picnic table",
    individual_seats: "Individual seats",
    divided_bench: "Divided bench",
    ledge: "Ledge",
    leaning_rail: "Leaning rail",
  },

  hostility: {
    welcoming: "Welcoming",
    moderate: "Boxed in",
    hostile: "Hostile",
    blurb: {
      true_bench: "Flat and open — sit three across, spread out, or lie down.",
      picnic_table: "Table and seats — settle in for a while.",
      individual_seats: "Separate seats — sit, but the spacing is fixed.",
      divided_bench: "Armrest dividers box your space in.",
      ledge: "A ledge to perch on, not really to rest.",
      leaning_rail: "A lean rail designed to move you back onto your feet.",
    },
  },

  materials: {
    wood: "Wood",
    stone: "Stone",
    metal: "Metal",
    concrete: "Concrete",
    plastic: "Plastic",
    mixed: "Mixed",
  },

  sunExposure: {
    full_sun: "Full sun",
    partial_shade: "Partial shade",
    full_shade: "Full shade",
  },

  noiseLevels: {
    quiet: "Quiet",
    moderate: "Moderate",
    loud: "Loud",
  },

  sightlines: {
    people_watching: "People-watching",
    nature: "Nature",
    water: "Water",
    skyline: "Skyline",
    street: "Street",
    wall: "Blank wall",
  },

  amenities: {
    backrest: "Backrest",
    covered: "Covered",
    lit_at_night: "Lit at night",
    near_water_fountain: "Water fountain nearby",
    near_restroom: "Restroom nearby",
    near_trash: "Trash bin nearby",
    wheelchair_accessible: "Wheelchair accessible",
  },

  addBench: {
    title: "Add a bench",
    sub: "Put a spot on the map for every other hoarder. Drop the pin where the bench is.",
    useMyLocation: "Use my current location",
    dropPin: "Drop a pin on the map",
    nameLabel: "Name (optional)",
    namePlaceholder: "The willow bench",
    notesLabel: "Field notes (optional)",
    notesPlaceholder: "Best in the afternoon — shaded, faces the fountain.",
    addPhoto: "Add a photo",
    submit: "Add to the map",
    success: "Added to the map. Thanks for growing the archive.",
    error: "Couldn't add that bench. Check your connection and try again.",
    locationMissing: "Set the bench's location first.",
  },

  review: {
    title: "Comfort",
    prompt: "Sat here? Rate how comfortable it was.",
    notePlaceholder: "Anything worth knowing before someone sits down?",
    submit: "Leave a rating",
    yours: "Your rating",
    signedOut: "Sign in to rate this bench.",
    thanks: "Thanks — your rating is on the map.",
    empty: "No ratings yet. Be the first to say how it sits.",
  },

  hoard: {
    title: "Your hoard",
    sub: "Your private archive of claimed benches.",
    empty: "Your hoard is empty. Claim a bench from the map to start collecting.",
    claim: "Hoard this bench",
    claimed: "Hoarded",
    unclaim: "Remove from hoard",
    labelLabel: "Tag this spot (optional)",
    labelPlaceholder: "Best spot to read at 3 PM",
    confirmRemove: "Remove this bench from your hoard?",
    limitReached: "Your hoard is full (200 benches). Remove one to claim another.",
  },

  rewards: {
    title: "Discovery",
    points: "Discovery points",
    pointsSub: "Earned for adding benches, leaving field notes, and claiming spots.",
    benchesAdded: "Benches added",
    benchesHoarded: "Benches hoarded",
    streak: "Day streak",
    streakSub: "Consecutive days you've found or added a bench.",
    rank: "Hoarder rank",
    badges: "Badges",
    badgesEmpty: "No badges yet. Add and claim benches to start unlocking them.",
    leaderboard: "Top hoarders",
    leaderboardEmpty: "Be the first on the board — add a bench.",
    earned: (label: string) => `Badge unlocked: ${label}`,
    pointsAwarded: (n: number) => `+${n} discovery points`,
  },

  you: {
    title: "You",
    settings: "Settings",
    notifications: "Notifications",
    signedOut: "You're browsing as a guest. Sign in to save your hoard and earn points.",
    deleteAccount: "Delete account",
    deleteConfirm: "Permanently delete your account, hoard, and the benches you've added?",
  },

  notifications: {
    title: "Notifications",
    sub: "Choose what Benchhoard is allowed to ping you about.",
    master: "Push notifications",
    masterSub: "The master switch. Off means total silence.",
    categoriesTitle: "Per-category",
    categories: {
      nearby: "New benches nearby",
      nearbySub: "Someone mapped a bench in an area you've hoarded in.",
      badges: "Badges & milestones",
      badgesSub: "When you unlock a badge or hit a streak.",
      verified: "Bench confirmations",
      verifiedSub: "When a bench you added gets confirmed by another hoarder.",
    },
    quietTitle: "Quiet hours",
    quietSub: "Hold all notifications during these hours, in your local time.",
    quietEnable: "Enable quiet hours",
    quietFrom: "From",
    quietTo: "To",
    saved: "Preferences saved.",
  },

  common: {
    retry: "Retry",
    loading: "Loading…",
    save: "Save",
    cancel: "Cancel",
    done: "Done",
    remove: "Remove",
    genericError: "Something went wrong. Please try again.",
  },
} as const;
