import React from 'react';
import {useRoute} from '@react-navigation/native';
import ProviderProfile from '../components/providers/ProviderProfile';
export default function ProsProfileScreen(){const route=useRoute<any>();return <ProviderProfile kind="pros" providerKey={typeof route.params?.slug==='string'?route.params.slug:''}/>;}
