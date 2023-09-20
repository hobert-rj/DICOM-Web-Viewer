import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DicomMetadataStore, MODULE_TYPES } from '@ohif/core';
import filesToStudies from './filesToStudies';
import { extensionManager } from '../../App.tsx';

type LocalProps = {
  modePath: string;
};

function Single({ modePath }: LocalProps) {
  const navigate = useNavigate();

  // Initializing the dicom local dataSource
  const dataSourceModules = extensionManager.modules[MODULE_TYPES.DATA_SOURCE];
  const localDataSources = dataSourceModules.reduce((acc, curr) => {
    const mods = [];
    curr.module.forEach(mod => {
      if (mod.type === 'localApi') {
        mods.push(mod);
      }
    });
    return acc.concat(mods);
  }, []);

  const firstLocalDataSource = localDataSources[0];
  const dataSource = firstLocalDataSource.createDataSource({});

  const microscopyExtensionLoaded = extensionManager.registeredExtensionIds.includes(
    '@ohif/extension-dicom-microscopy'
  );

  const loadUrls = async (urls) => {
    const studies = await filesToStudies(urls, dataSource);

    const query = new URLSearchParams();

    if (microscopyExtensionLoaded) {
      // TODO: for microscopy, we are forcing microscopy mode, which is not ideal.
      //     we should make the local drag and drop navigate to the worklist and
      //     there user can select microscopy mode
      const smStudies = studies.filter(id => {
        const study = DicomMetadataStore.getStudy(id);
        return (
          study.series.findIndex(
            s => s.Modality === 'SM' || s.instances[0].Modality === 'SM'
          ) >= 0
        );
      });

      if (smStudies.length > 0) {
        smStudies.forEach(id => query.append('StudyInstanceUIDs', id));

        modePath = 'microscopy';
      }
    }

    // Todo: navigate to work list and let user select a mode
    studies.forEach(id => query.append('StudyInstanceUIDs', id));
    query.append('datasources', 'dicomlocal');

    if (studies.length === 1) {
      navigate(`/viewer/dicomlocal?${decodeURIComponent(query.toString())}`);
    } else {
      navigate(`/${modePath}?${decodeURIComponent(query.toString())}`);
    }
  };

  // Set body style
  useEffect(() => {
    document.body.classList.add('bg-black');
    const queryParams = new URLSearchParams(window.location.search);
    const urls = queryParams.get('urls');
    if (urls) {
      loadUrls(urls.split(',')).then();
    }
    return () => {
      document.body.classList.remove('bg-black');
    };
  }, []);

  return <div>loading</div>;
}

export default Single;
