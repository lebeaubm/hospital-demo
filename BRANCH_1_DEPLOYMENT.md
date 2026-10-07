# Deploy the branch-1 owner portal

The test frontend needs a backend that runs the owner-role code on `branch-1`.
The error `Invalid role. Must be PATIENT or STAFF.` comes from the older API.

## Render setup

1. In Render, choose **New > Blueprint** and select `lebeaubm/hospital-demo`.
2. Select Git branch **branch-1**.
3. Set the Blueprint file path to **render-branch-1.yaml**.
4. Review the two services: the new **peaceloving-branch-1-api** backend on the
   Free plan and the existing **peacelovinghomehealth** test frontend.
5. Create the Blueprint and wait for both services to show **Live**.
6. Open <https://peacelovinghomehealth.onrender.com/>, refresh the page, and retry
   the owner-role change while signed in as an administrator.

Render service references connect the new backend to the existing database and
encryption/signing keys. The frontend receives the new backend's assigned public
URL automatically. No secret values belong in Git or in this guide.

The database remains shared: role changes and other saved data affect the same
accounts used by both websites. Use the branch-1 website for the new Owner role.

## Validation completed

- 52 focused backend tests passed, including owner promotion, demotion, protected
  admin accounts, and denial of role changes by non-admin users.
- The original `render.yaml` is retained for the existing main deployment.
- The new Render backend has not been created yet; the live role update remains
  unverified until this Blueprint is deployed.

References: [Render Blueprint service references](https://render.com/docs/blueprint-spec#referencing-service-properties),
[Render environment variables](https://render.com/docs/environment-variables),
[Render Free service limits](https://render.com/docs/free).
