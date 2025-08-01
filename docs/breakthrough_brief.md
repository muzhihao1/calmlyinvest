# Breakthrough Brief: Fix API 404 Errors

## Current State & Goal
**Current**: API endpoints return 404 errors on Vercel deployment due to incorrect routing configuration
**Goal**: Make all API endpoints accessible and functional on the deployed application

## Constraints & Uncertainties
**Constraints**:
- Vercel functions expect API files in `/api/` directory at repository root
- Current API files are in `/calmlyinvest/api/`
- Must maintain backward compatibility
- Cannot break existing local development setup

**Uncertainties**:
- Whether moving files will affect local development
- If there are hardcoded paths in the application

## Hypothesis List
1. **H1**: Create symbolic links from `/api/` to `/calmlyinvest/api/` files
2. **H2**: Copy API files to root `/api/` directory during build process
3. **H3**: Update vercel.json to point to the correct API directory location

## Selected Hypothesis
**H2**: Copy API files to root `/api/` directory during build process
- Most reliable for Vercel deployment
- Doesn't affect local development
- Can be automated in build script

## Experiment Plan
1. Create a build script to copy API files
2. Update vercel.json to run the script before deployment
3. Test with a simple endpoint first
4. Deploy and verify functionality

## Implementation Steps
1. Create copy script for API files
2. Update vercel.json configuration
3. Create verification endpoints
4. Test deployment
5. Document rollback procedure