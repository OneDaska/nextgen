-- Members may remove only their own evidence within their current function scope.
-- This also requires the existing active-session and MFA rules through evidence_allowed.
create policy evidence_delete_own on public.nextgen_kpi_evidence
for delete to authenticated
using (uploaded_by = (select auth.uid()) and nextgen_access_private.evidence_allowed(kpi_id));
grant delete on public.nextgen_kpi_evidence to authenticated;
