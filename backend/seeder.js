const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

const User = require('./models/User');
const Community = require('./models/Community');
const Discussion = require('./models/Discussion');
const Comment = require('./models/Comment');

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MONGO DB Connected...'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

const importData = async () => {
  try {
    
    await Comment.deleteMany();
    await Discussion.deleteMany();
    await Community.deleteMany();
    await User.deleteMany();

    console.log('Data Destroyed...');

    
    const password = 'password123';
    const users = await User.create([
      {
        username: 'PlatformAdmin',
        email: 'admin@discussify.com',
        password: password,
        passwordConfirm: password,
        role: 'admin',
        bio: 'Official Administrator of Discussify. Keeping the community safe, compliant, and high-signal.',
        photo: ''
      },
      {
        username: 'Sarah_Dev',
        email: 'sarah@test.com',
        password: password,
        passwordConfirm: password,
        role: 'user',
        bio: 'Full Stack Developer | MERN Stack Enthusiast | Coffee Addict.',
        photo: ''
      },
      {
        username: 'Alex_SystemDesign',
        email: 'alex@test.com',
        password: password,
        passwordConfirm: password,
        role: 'user',
        bio: 'Senior Architect. I love distributed systems and scalability challenges.',
        photo: ''
      },
      {
        username: 'DesignerDave',
        email: 'dave@test.com',
        password: password,
        passwordConfirm: password,
        role: 'user',
        bio: 'UI/UX Designer. Pixel perfectionist. Sketch & Figma.',
        photo: ''
      },
      {
        username: 'IndieHacker_Mike',
        email: 'mike@test.com',
        password: password,
        passwordConfirm: password,
        role: 'user',
        bio: 'Building SaaS products in public. Currently working on my 3rd startup.',
        photo: ''
      }
    ]);

    console.log('Users Added...');

    
    const communities = await Community.create([
      {
        name: 'React & Next.js Pro',
        description:
          'A dedicated, advanced-level space for professional frontend engineers and architects to deep-dive into React\'s internal rendering behavior, Next.js App Router architecture, Server and Client Component strategies, code-splitting models, hydration costs, performance profiling, caching strategies, and real-world production bottlenecks. Discussions prioritize scalability, maintainability, and long-term architectural decisions over short-term hacks.',
        creator: users[1]._id, // Sarah
        isPrivate: false,
        members: [
          { user: users[1]._id, role: 'admin' }, // Sarah
          { user: users[3]._id, role: 'member' } // Dave
        ]
      },
      {
        name: 'System Design Interview Prep',
        description:
          'A highly focused technical forum specifically designed for professionals preparing for system design interviews at top-tier technology companies. Topics include load balancing algorithms, horizontal vs vertical scaling strategies, CAP theorem implications, distributed caching solutions, database partitioning, consensus algorithms, and case studies of large-scale applications like Netflix, Uber, and Amazon. Emphasis is on trade-off analysis, clear communication, and building interview-ready mental models.',
        creator: users[2]._id, // Alex
        isPrivate: false,
        members: [
          { user: users[2]._id, role: 'admin' }, // Alex
          { user: users[1]._id, role: 'member' } // Sarah
        ]
      },
      {
        name: 'Startup Founders Circle',
        description:
          'A private, highly curated network for startup founders, solopreneurs, and builders focused on long-term sustainability rather than short-term hype. The emphasis is on real-world execution including user acquisition strategies, retention metrics, churn prevention, monetization experiments, pricing psychology, growth frameworks, and operational efficiency in early and mid-stage startups. Conversations are centered around what actually moves the revenue and retention needles.',
        creator: users[4]._id, // Mike
        isPrivate: false,
        members: [
          { user: users[4]._id, role: 'admin' }, // Mike
          { user: users[2]._id, role: 'member' } // Alex
        ]
      },
      {
        name: 'Discussify Beta Testers',
        description:
          'An invite-only, pre-release evaluation group reserved for early-stage users who are actively participating in the testing and validation of new platform features. Members are expected to provide structured feedback on performance, security, UI consistency, data handling, and edge cases before features are rolled into the production environment. The focus is on accelerating product-market fit while maintaining platform stability.',
        creator: users[0]._id, // Admin
        isPrivate: true,
        members: [{ user: users[0]._id, role: 'admin' }]
      }
    ]);

    console.log('Communities Added...');

    
    const discussions = await Discussion.create([
      {
        title:
          'React Server Components vs Client Components in Production: Is the Trade-Off Really Worth It?',
        content:
          'After extensive experimentation with Next.js 14 and the App Router, it is clear that React Server Components deliver a measurable improvement in initial load performance and Time to First Byte. However, the cognitive overhead introduced by the hybrid rendering model, implicit caching, streaming, and boundary management is substantial. In a production environment with multiple engineers, maintaining clarity around data fetching patterns, component boundaries, and side effects becomes increasingly complex. I am currently evaluating whether the long-term performance upside truly justifies this additional operational and developmental overhead for mid-scale platforms and internal tools.',
        community: communities[0]._id, // React Comm
        author: users[1]._id, // Sarah
        likes: [users[3]._id, users[2]._id]
      },
      {
        title: 'Designing a Globally Scalable, Fault-Tolerant URL Shortening System',
        content:
          'I am currently architecting a large-scale URL shortening service similar to Bitly or TinyURL. The key challenges include generating globally unique, non-predictable short keys, handling billions of redirections per day, ensuring low-latency access through multi-region replication, and implementing an intelligent caching strategy to reduce database load. I am debating between Snowflake-style distributed ID generation versus a centralized Key Generation Service with pre-allocated ranges. Additionally, collision handling, data partitioning strategy, abuse prevention, observability, and real-time analytics tracking need to be addressed as first-class architectural concerns.',
        community: communities[1]._id, // System Design
        author: users[4]._id, // Mike
        likes: [users[1]._id, users[2]._id]
      },
      {
        title: 'Scaling from $0 to $1,000+ MRR: Tactical Insights and Strategic Pivots',
        content:
          'Reaching the first $1,000 in Monthly Recurring Revenue was less about engineering excellence and more about market validation, distribution leverage, and aggressive feedback loops. Nearly three months were spent perfecting UI and feature sets that no users explicitly requested. The turning point came when the focus shifted to direct outreach, targeted community engagement, and validating specific pain points before writing code. This journey reinforced the importance of rapid iteration, ruthless prioritization, and investing more energy into user acquisition, onboarding, and retention models than into unnecessary technical perfection. Happy to break down what worked, what failed, and what I would do differently on the next product.',
        community: communities[2]._id, // Startup
        author: users[4]._id, // Mike
        likes: [users[0]._id, users[1]._id, users[3]._id]
      }
    ]);

    console.log('Discussions Added...');

    await Comment.create([
      // React Thread
      {
        content:
          'From a real-world implementation perspective, the learning curve and cognitive overhead introduced by React Server Components is significant. While the initial performance gains are noticeable, the complexity around data streaming, partial hydration, and mental model shifts makes it difficult for teams that do not have strong architectural discipline. For smaller applications and internal dashboards, traditional client-side rendering still provides greater flexibility, debuggability, and predictability in day-to-day development cycles.',
        discussion: discussions[0]._id,
        author: users[3]._id // Dave
      },
      {
        content:
          'Next.js caching is currently extremely aggressive and somewhat opaque. Without a clear implementation strategy using route segment configurations, tags, revalidatePath, and revalidateTag, it is very easy to end up serving stale or inconsistent data across sessions. Teams need to invest in caching governance, define clear ownership, and explicitly document where static, dynamic, and ISR strategies are applied to avoid serious production issues and user confusion.',
        discussion: discussions[0]._id,
        author: users[2]._id // Alex
      },

      // System Design Thread
      {
        content:
          'Avoid auto-incremented identifiers at all costs in a production-grade, public-facing system. They expose your internal scale, enable straightforward enumeration attacks, and create challenges when horizontally scaling across multiple regions. A more resilient approach is to implement a distributed ID generation mechanism such as a Snowflake-style generator, UUIDv7, or a centralized Key Generation Service backed by sharded caches. This ensures uniqueness, high availability, and horizontal scalability while keeping the ID pattern opaque to external consumers.',
        discussion: discussions[1]._id,
        author: users[2]._id // Alex
      },

      // Startup Thread
      {
        content:
          'This perfectly reinforces the reality that technical execution is only half of the equation. The real differentiator is distribution and how quickly you can validate whether the problem you think you are solving is actually a top-tier priority for your target users. Would you be willing to share deeper metrics on your outbound strategy? Specifically, what was your cold email open rate, response rate, and conversion ratio across different messaging variations? Those numbers would provide strong signal for others trying to optimize similar funnels.',
        discussion: discussions[2]._id,
        author: users[1]._id // Sarah
      },
      {
        content:
          'Huge congratulations on crossing the $1k MRR milestone — that is a critical validation point in any SaaS lifecycle. I am particularly interested in whether any portion of that growth was driven by paid channels such as Google Ads, Meta, or sponsorships, or if the traction was entirely organic via content, communities, and word-of-mouth. Understanding the split between paid and organic, as well as your payback period assumptions, would be extremely valuable for other early-stage founders.',
        discussion: discussions[2]._id,
        author: users[3]._id // Dave
      }
    ]);

    console.log('Comments Added...');
    console.log('DATA IMPORTED SUCCESSFULLY!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Comment.deleteMany();
    await Discussion.deleteMany();
    await Community.deleteMany();
    await User.deleteMany();

    console.log('Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}