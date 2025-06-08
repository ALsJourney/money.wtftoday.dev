'use client';

import {Suspense} from 'react';

import EditPageContent from "@/components/edit-page-content";

export default function EditPage() {

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EditPageContent/>
        </Suspense>
    );
}