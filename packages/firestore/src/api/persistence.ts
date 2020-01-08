import {Code, FirestoreError} from "../util/error";
import * as objUtils from "../util/obj";
import {IndexedDbPersistenceSettings} from "../core/firestore_client";
import {IndexedDbPersistence} from "../local/indexeddb_persistence";
import {Deferred} from "../util/promise";

// enablePersistence() defaults:
const DEFAULT_SYNCHRONIZE_TABS = false;

export function enablePersistence(settings?: firestore.PersistenceSettings): Promise<void> {
  if (this._firestoreClient) {
  throw new FirestoreError(
    Code.FAILED_PRECONDITION,
    'Firestore has already been started and persistence can no longer ' +
    'be enabled. You can only call enablePersistence() before calling ' +
    'any other methods on a Firestore object.'
  );
}

let synchronizeTabs = false;

if (settings) {
  synchronizeTabs = objUtils.defaulted( settings.synchronizeTabs,
    DEFAULT_SYNCHRONIZE_TABS
  );
}

return this.configureClient(
  new IndexedDbPersistenceSettings(
    this._settings.cacheSizeBytes,
    synchronizeTabs
  )
);
}

export function clearPersistence(): Promise<void> {
  const persistenceKey = IndexedDbPersistence.buildStoragePrefix(
    this.makeDatabaseInfo()
  );
const deferred = new Deferred<void>();
this._queue.enqueueAndForgetEvenAfterShutdown(async () => {
  try {
    if (
      this._firestoreClient !== undefined &&
      !this._firestoreClient.clientTerminated
    ) {
      throw new FirestoreError(
        Code.FAILED_PRECONDITION,
        'Persistence cannot be cleared after this Firestore instance is initialized.'
      );
    }
    await IndexedDbPersistence.clearPersistence(persistenceKey);
    deferred.resolve();
  } catch (e) {
    deferred.reject(e);
  }
});
return deferred.promise;
}
