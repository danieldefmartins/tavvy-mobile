import React from 'react';
import { useNavigation } from '@react-navigation/native';
import CruiseDirectory from '../components/cruises/CruiseDirectory';

export default function CruiseDirectoryScreen() {
  const navigation = useNavigation<any>();
  return <CruiseDirectory onBack={() => navigation.canGoBack()
    ? navigation.goBack()
    : navigation.navigate('UniverseDiscovery')} />;
}
