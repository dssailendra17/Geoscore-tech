# Job Status Components - Usage Guide

This guide shows how to use the job status UI components created in `client/src/components/ui/job-status.tsx`.

---

## Components Overview

### 1. JobStatusBadge
Simple badge showing job status with icon and color coding.

### 2. JobStatusCard
Full card view of a single job with progress, errors, and details.

### 3. BrandJobsList
List of all jobs for a brand with real-time updates.

### 4. JobProgressIndicator
Inline progress indicator for embedding in other components.

---

## Usage Examples

### Example 1: Show Job Status Badge

```tsx
import { JobStatusBadge } from "@/components/ui/job-status";

function MyComponent() {
  const jobStatus = "running"; // or "pending", "completed", "failed"
  
  return (
    <div>
      <h3>Job Status</h3>
      <JobStatusBadge status={jobStatus} />
    </div>
  );
}
```

**Result:** A colored badge with an icon showing the job status.

---

### Example 2: Display Job Status Card

```tsx
import { JobStatusCard } from "@/components/ui/job-status";

function JobDetails() {
  const jobId = "job_abc123";
  
  return (
    <JobStatusCard 
      jobId={jobId}
      title="Brand Enrichment"
      description="Fetching brand data from external sources"
    />
  );
}
```

**Features:**
- Shows job type, status badge, and description
- Displays progress bar for running jobs
- Shows error messages for failed jobs
- Auto-updates via polling (every 3 seconds)

---

### Example 3: List All Brand Jobs

```tsx
import { BrandJobsList } from "@/components/ui/job-status";
import { CURRENT_BRAND } from "@/lib/data-model";

function JobHistoryPage() {
  return (
    <div>
      <h2>Recent Jobs</h2>
      <BrandJobsList 
        brandId={CURRENT_BRAND.id} 
        limit={20} 
      />
    </div>
  );
}
```

**Features:**
- Shows list of recent jobs
- Real-time status updates (polls every 10 seconds)
- Loading and error states
- Compact card layout

---

### Example 4: Inline Progress Indicator

```tsx
import { JobProgressIndicator } from "@/components/ui/job-status";
import { useState } from "react";

function OnboardingFlow() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const handleStartEnrichment = async () => {
    const response = await triggerBrandEnrichment(brandId);
    setJobId(response.jobId);
  };

  return (
    <div>
      <button onClick={handleStartEnrichment}>
        Start Enrichment
      </button>
      
      {jobId && (
        <JobProgressIndicator 
          jobId={jobId}
          onComplete={() => {
            setIsComplete(true);
            console.log("Job completed!");
          }}
        />
      )}
      
      {isComplete && <p>Enrichment complete! ✅</p>}
    </div>
  );
}
```

**Features:**
- Minimal inline UI
- Auto-dismisses on completion
- Callback support
- Shows errors inline

---

## Integration Examples

### In Onboarding Flow

```tsx
import { JobProgressIndicator } from "@/components/ui/job-status";
import { useTriggerEnrichment } from "@/hooks/use-brand-context";

function OnboardingStep2() {
  const { mutate: triggerEnrichment, data } = useTriggerEnrichment(brandId);
  
  return (
    <div>
      <h2>Step 2: Enrich Brand Data</h2>
      <button onClick={() => triggerEnrichment()}>
        Start Enrichment
      </button>
      
      {data?.jobId && (
        <JobProgressIndicator 
          jobId={data.jobId}
          onComplete={() => {
            // Move to next step
            goToStep(3);
          }}
        />
      )}
    </div>
  );
}
```

---

### In Admin Brand View

```tsx
import { BrandJobsList } from "@/components/ui/job-status";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

function AdminBrandView({ brandId }: { brandId: string }) {
  return (
    <div className="space-y-6">
      {/* Other brand details */}
      
      <Card>
        <CardHeader>
          <CardTitle>Job History</CardTitle>
        </CardHeader>
        <CardContent>
          <BrandJobsList brandId={brandId} limit={10} />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### In Settings Page

```tsx
import { JobStatusCard } from "@/components/ui/job-status";
import { useBrandJobs } from "@/hooks/use-jobs";

function SettingsAnalysisSchedule() {
  const { data: jobs } = useBrandJobs(brandId);
  const lastJob = jobs?.[0]; // Most recent job

  return (
    <div>
      <h3>Last Analysis Run</h3>
      {lastJob && (
        <JobStatusCard 
          jobId={lastJob.id}
          title="Scheduled Analysis"
          description={`Last run: ${new Date(lastJob.createdAt).toLocaleString()}`}
        />
      )}
    </div>
  );
}
```

---

## Styling Customization

All components accept a `className` prop for custom styling:

```tsx
<JobStatusBadge 
  status="running" 
  className="text-lg px-4 py-2" 
/>

<JobStatusCard 
  jobId={jobId}
  className="border-2 border-primary"
/>
```

---

## Status Values

The components recognize these status values:

- `"pending"` - Job is queued but not started
- `"running"` - Job is currently executing
- `"completed"` - Job finished successfully
- `"failed"` - Job encountered an error

---

## Polling Behavior

- **JobStatusCard**: Polls every 3 seconds while job is pending/running
- **BrandJobsList**: Polls every 10 seconds for all jobs
- **JobProgressIndicator**: Polls every 3 seconds, stops on completion/failure

Polling automatically stops when:
- Job reaches "completed" or "failed" status
- Component is unmounted
- 5 minutes have elapsed (safety timeout)

---

## Error Handling

All components handle errors gracefully:

```tsx
// If job not found
<JobStatusCard jobId="invalid_id" />
// Shows: "Job not found" with error icon

// If API fails
<BrandJobsList brandId={brandId} />
// Shows: "Failed to load jobs" with retry option
```

---

## TypeScript Types

```typescript
interface JobStatusBadgeProps {
  status: string;
  className?: string;
}

interface JobStatusCardProps {
  jobId: string;
  title?: string;
  description?: string;
}

interface BrandJobsListProps {
  brandId: string;
  limit?: number;
}

interface JobProgressIndicatorProps {
  jobId: string;
  onComplete?: () => void;
}
```

---

## Best Practices

1. **Use JobProgressIndicator** for inline, temporary status updates
2. **Use JobStatusCard** for detailed job information pages
3. **Use BrandJobsList** for job history/admin views
4. **Use JobStatusBadge** for compact status indicators in tables/lists

5. **Always provide onComplete callback** when using JobProgressIndicator
6. **Set appropriate limits** on BrandJobsList to avoid performance issues
7. **Add custom titles/descriptions** to JobStatusCard for better UX

---

## Common Patterns

### Pattern 1: Trigger Job + Show Progress

```tsx
const [jobId, setJobId] = useState<string | null>(null);

const handleTrigger = async () => {
  const result = await triggerJob();
  setJobId(result.jobId);
};

return (
  <>
    <button onClick={handleTrigger}>Start</button>
    {jobId && <JobProgressIndicator jobId={jobId} />}
  </>
);
```

### Pattern 2: Show Recent Jobs

```tsx
<BrandJobsList brandId={brandId} limit={5} />
```

### Pattern 3: Monitor Specific Job

```tsx
<JobStatusCard 
  jobId={jobId}
  title="Custom Title"
  description="Custom description"
/>
```

---

## Next Steps

1. Integrate into onboarding flow
2. Add to admin brand view
3. Add to settings page
4. Consider adding to dashboard for recent activity

---

**Created:** January 17, 2026  
**Component File:** `client/src/components/ui/job-status.tsx`  
**Hook Dependencies:** `use-jobs.ts`
