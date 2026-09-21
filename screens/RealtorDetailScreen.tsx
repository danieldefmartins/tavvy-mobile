import React from 'react';
import {useRoute} from '@react-navigation/native';
import ProviderProfile from '../components/providers/ProviderProfile';
export default function RealtorDetailScreen(){const route=useRoute<any>();return <ProviderProfile kind="realtor" providerKey={typeof route.params?.realtorId==='string'?route.params.realtorId:''}/>;}
