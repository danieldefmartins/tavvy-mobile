import React from 'react';
import {useRoute} from '@react-navigation/native';
import ProviderDirectory from '../components/providers/ProviderDirectory';
export default function ProsBrowseScreen(){const route=useRoute<any>();const p=route.params||{};return <ProviderDirectory key={JSON.stringify([p.categorySlug,p.query,p.location])} kind="pros" initialCategory={typeof p.categorySlug==='string'?p.categorySlug:''} initialQuery={typeof p.query==='string'?p.query:''} initialLocation={typeof p.location==='string'?p.location:''}/>;}
