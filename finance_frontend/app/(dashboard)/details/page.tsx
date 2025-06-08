"use client"


import DetailPageContent from "@/components/detail-page-content";
import {Suspense} from "react";


export default function DetailsPage() {


    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DetailPageContent/>
        </Suspense>
    );
}