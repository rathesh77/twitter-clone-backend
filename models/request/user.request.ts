interface FileUpload {
  base64String: string,
  name: string,
  size: number
}
interface UserUpdate {
  username?: string,
  email?: string,
  avatar?: FileUpload,
  banner?: FileUpload
}

export default UserUpdate;