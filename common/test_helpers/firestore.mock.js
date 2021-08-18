export class FirestoreMock {
  constructor () {
    // mocked methods that return the class
    this.mockCollection = jest.fn(() => this)
    this.mockCollectionGroup = jest.fn(() => this)
    this.mockWhere = jest.fn(() => this)
    this.mockOrderBy = jest.fn(() => this)
    this.mockDoc = jest.fn(() => this)

    // methods that return promises
    this.mockAdd = jest.fn(() => Promise.resolve(this._mockAddReturn))
    this.mockGet = jest.fn(() => Promise.resolve(this._mockGetReturn))
    this.mockDelete = jest.fn(() => Promise.resolve(this._mockDeleteReturn))
    this.mockUpdate = jest.fn(() => Promise.resolve(this._mockUpdateReturn))

    // methods that accepts callbacks
    this.mockOnSnaptshot = jest.fn((success, error) => success(this._mockOnSnaptshotSuccess))

    // return values
    this._mockAddReturn = null
    this._mockGetReturn = null
    this._mockDeleteReturn = null
    this._mockOnSnaptshotSuccess = null
    this._mockUpdateReturn = null
    // TODO add _mockOnSnaptshotError to return error results
  }

  collection (c) {
    return this.mockCollection(c)
  }

  collectionGroup (c) {
    return this.mockCollectionGroup(c)
  }

  where (...args) {
    return this.mockWhere(...args)
  }

  orderBy (...args) {
    return this.mockOrderBy(...args)
  }

  doc (...args) {
    return this.mockDoc(...args)
  }

  add (a) {
    return this.mockAdd(a)
  }

  get () {
    return this.mockGet()
  }

  delete () {
    return this.mockDelete()
  }

  onSnapshot (success, error) {
    return this.mockOnSnaptshot(success, error)
  }

  update () {
    return this.mockUpdate()
  }

  set mockAddReturn (val) {
    this._mockAddReturn = val
  }

  set mockGetReturn (val) {
    this._mockGetReturn = val
  }

  set mockOnSnaptshotSuccess (val) {
    this._mockOnSnaptshotSuccess = val
  }

  reset () {
    // reset all the mocked returns
    this._mockAddReturn = null
    this._mockGetReturn = null
    this._mockOnSnaptshotSuccess = null
    this._mockUpdateReturn = null
    this._mockDeleteReturn = null
    // reset all the mocked functions
    this.mockCollection.mockClear()
    this.mockCollectionGroup.mockClear()
    this.mockWhere.mockClear()
    this.mockOrderBy.mockClear()
    this.mockAdd.mockClear()
    this.mockGet.mockClear()
  }
}

export class FirestoreDate {
  constructor (date) {
    this.seconds = date.getTime()
    this.date = date
  }

  toDate () {
    return this.date
  }
}
