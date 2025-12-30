import { Dialog, DialogPanel, DialogTitle, Button } from '@headlessui/react'
import PropTypes from "prop-types"

export default function FileDuplicatePopup({ openDuplicatePopup, setOpenDuplicatePopup }) {
  return (
      <Dialog open={openDuplicatePopup} as="div" className="relative z-10 focus:outline-none" onClose={() => {setOpenDuplicatePopup(false)}}>
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full w-full bg-black/80 items-center justify-center p-4">
            <DialogPanel
              transition
              className="w-full max-w-md rounded-xl bg-white/5 p-6 backdrop-blur-2xl duration-300 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0"
            >
              <DialogTitle as="h3" className="text-xl font-medium text-white">
                Duplicate file
              </DialogTitle>
              <p className="my-4 text-sm text-white/50">
                A file with the same name has been uploaded before. Please rename the file before uploading again. 
              </p>
              <div className="mt-8 flex justify-end gap-4">
                <Button
                  className="inline-flex items-center gap-2 rounded-md bg-blue-500 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-inner shadow-white/10 focus:not-data-focus:outline-none data-focus:outline data-focus:outline-white data-hover:bg-blue-400"
                  onClick={() => {setOpenDuplicatePopup(false)}}
                >
                  Okay
                </Button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
  )
}

FileDuplicatePopup.propTypes = {
  openDuplicatePopup: PropTypes.func.isRequired,
  setOpenDuplicatePopup: PropTypes.func.isRequired
}